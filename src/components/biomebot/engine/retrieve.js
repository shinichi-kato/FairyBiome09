/* 類似度計算
  retrieve関数ではMessage.textに対して類似度(内積)を計算し、得られた1次元のスコアベクターに
  特徴量行列をconcatする。
  得られた全体のスコア行列について score = score*weights という重み付け計算を行って
  その中でscoreが最大のものを選出する。

*/

/*
debugメモ
キャッシュがうまく生成していないときにapplyでエラーになることがある。
エラーメッセージにはretrieve.js 125:60とか表示されるが、125行がどこか特定できず
*/

import {
  zeros, apply, sum, dot, dotMultiply,
  map, norm, randomInt, concat, divide
} from "mathjs";


export function retrieve(message, cache, coeffs) {
  // message: 入力Message
  // cache: 対象パートのtfidfなどのキャッシュデータ
  // coeffs: {weights,biases} featureの重み付け係数

  // --------------------------------------------------------
  //
  // テキストの類似度計算
  //
  // 内部表現のリストとして与えられbたmesageを使ってテキスト検索
  // tfidf,df,vocabを利用してtextに一番似ているdictの行番号を返す

  if(cache.tfidf.length === 0 || cache.fv.length === 0){
    return { index: null, score: 0};
  }

  // wv
  const vocabLength = cache.vocab.length;
  if (vocabLength === 0) {
    return { index: null, score: 0 };
  }

  const wv = zeros(vocabLength);

  for (let word of message.text) {
    let pos = cache.vocab.indexOf(word);
    if (pos !== -1) {
      // wv.set([pos], wv.get([pos]) + 1);
      wv[pos] = wv[pos]+1;
    }
  }
  if (sum(wv) === 0) {
    return { index: null, score: 0 };
  }

  // tfidf計算
  const tf = divide(wv,sum(wv));
  const tfidf = dotMultiply(tf, cache.idf);

  // 正規化

  const n = norm(tfidf);
  const ntfidf = map(tfidf, x => (divide(1, n)));

  // message.textに対するinScript各行の類似度
  let textScore;
  try {
    textScore = apply(cache.tfidf, 1, x => dot(x, ntfidf)).valueOf();
  } catch (error) {
    textScore = [];
    console.log("invalid cache.tfidf,tfidf=", cache.tfidf, "error=",error)
  }
  
  // --------------------------------------------------------
  //
  // messageに含まれるその他の特徴量の類似度
  //
  // 特徴量のone-hot vectorとする行列に対して入力メッセージとの内積を取り、
  // 重み付けした後合計。重みの合計値は１なのでtotalScoreの最大値も1
  
  // cache.fvとmessage.featuresの各要素ごとに積→共通した項が１になる　fv.length×features.lengthのmatrixができる
  const fmtx = apply(cache.fv, 1, x => dotMultiply(x, message.features));
  
  // 先頭をtextscore,以降をfeatureのスコアとした配列を作る
  console.log("fmtx=",fmtx, "textScore=",textScore)
  let totalScore = concat(textScore, fmtx)
  console.log("message.features=",message.features,"cache.fv=",cache.fv,"fmtx=",fmtx,"totalScore=",totalScore)
  try {
    totalScore = apply(totalScore, 1, x => dotMultiply(x, coeffs.weights));
    totalScore = apply(totalScore, 1, x => sum(x));
  }catch(error){
    console.log("invalid coeffs coeffs=", coeffs,"totalscore=",totalScore)
  }



  // 最も類似度が高かった行のindexとその類似度を返す。
  // 同点一位が複数あった場合はランダムに一つを選ぶ
  const max = Math.max(...totalScore);

  let cand = [];
  for (let i = 0, l = totalScore.length; i < l; i++) {
    let score = totalScore[i];
    if (score === max) {
      cand.push(cache.index[i]);
    }
  }

  return {
    score: max,
    index: cand[randomInt(cand.length)]
  };
}