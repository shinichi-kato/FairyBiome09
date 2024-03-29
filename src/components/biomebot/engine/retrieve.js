/* 類似度計算
  retrieve関数ではMessage.textに対して類似度(内積)を計算し、得られた1次元のスコアベクターに
  特徴量行列をconcatする。
  得られた全体のスコア行列について score = score*weights という重み付け計算を行って
  その中でscoreが最大のものを選出する。

*/


import {
  zeros, apply, sum, dot, dotMultiply,
  map, norm, randomInt, subset, divide, typeOf, matrixFromColumns, index, range, count
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

  if (typeOf(cache.tfidf) !== 'Matrix' || cache.fv.length === 0) {
    console.log("cache empty")
    return { index: null, score: 0 };
  }

  // wv
  const vocabLength = Object.keys(cache.vocab).length;
  if (vocabLength === 0) {
    console.log("vocab empty")
    return { index: null, score: 0 };
  }

  let wv = zeros(vocabLength);
  for (let word of message.text) {
    let pos = cache.vocab[word];
    if (pos !== undefined) {
      wv.set([pos], wv.get([pos]) + 1);
    }
  }
  const sumWv = sum(wv)
  if (sumWv === 0) {
    console.log(`vocab no match with"${message.text}"`)
    return { index: null, score: 0 };
  }
  // tfidf計算
  const tf = divide(wv, sumWv);
  const tfidf = dotMultiply(tf, cache.idf);
  // console.log("tfidf=",tfidf)
  // 正規化

  const n = norm(tfidf);
  const ntfidf = map(tfidf, x => (divide(x, n)));

  // message.textに対するinScript各行の類似度
  let textScore = [];
  try {
    textScore = apply(cache.tfidf, 1, x => dot(x, ntfidf));
  } catch (error) {
    textScore = [];
    console.log("invalid cache.tfidf,tfidf=", cache.tfidf, "error=", error)
  }

  console.log("textScore=",textScore)

  // bugfixで入れたが本当に必要か？↓
  if(textScore.size()[0] === 1){
    let cand = cache.index[0];
    console.log("候補が一つのみ：",cand)
    return {
      score: 1,
      index: cand[randomInt(cand.length)]
    };
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
  const textScoreIndex = index(range(0, count(textScore)), 0);
  let totalScore = subset(fmtx, textScoreIndex, matrixFromColumns(textScore));
  
  try {
    totalScore = apply(totalScore, 1, x => dotMultiply(x, coeffs.weights));
    
    totalScore = apply(totalScore, 1, x => sum(x)).valueOf();
  } catch (error) {
    console.log(error,"invalid coeffs coeffs=", coeffs, "totalscore=", totalScore)
  }



  // 最も類似度が高かった行のindexとその類似度を返す。
  // 同点一位が複数あった場合はランダムに一つを選ぶ


  console.log("totalScores=",totalScore)
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