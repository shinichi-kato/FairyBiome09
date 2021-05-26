/*
  スクリプトをmatrixに変換
  botId,partNameで指定されたスクリプトをdbから読み込む。
  スクリプトは
  [{in:[inputs],out:[],prev,next}...]
  という形式で与えられ、inputsは文字列またはmessage型データが有効である。
  Message型データは以下のようにコーディングする
  Message {
    text: 内部表現化
    person, mood, site, weather, season, dayPart : one-hotベクター化
  }

  textは行ごとに正規化されたtfidf行列に変換する。
  retrieve関数ではMessage.textに対して類似度(内積)を計算し、得られた1次元のスコアベクターに
  特徴量行列をconcatする。
  得られた全体のスコア行列について score = score*weights + biases という重み付け計算を行って
  その中でscoreが最大のものを選出する。

  この関数は以下の計算結果を返す
  {
    index:　スクリプトの
  }
*/

import {
  zeros, divide, apply, sum,
  diag, multiply, isPositive, map, norm, matrixFromColumns
} from "mathjs";

import { db } from '../dbio';
import { Message } from '../../message';
import { textToInternalRepr } from '../internal-repr';
import { TinySegmenter } from '../tinysegmenter';

let segmenter = new TinySegmenter();


function appendValidNode(array, node) {
  if (typeof node === 'string') {
    array.push([new Message(node)]);
  }
  else if (Array.isArray(node) && node.length !== 0) {
    array.push(...node.map(n => new Message(n)));
  }
  return;
}

onmessage = function (event) {
  const { botId, partName } = event.data;

  console.log("matrixize-start: ", botId, partName);
  (async () => {
    const script = await db.readScript(botId, partName);
    // inスクリプトとoutスクリプトに分割
    let inScript = [];
    let outScript = [];

    for (let i = 0, len = script.length; i < len; i++) {
      if ('in' in script[i] && 'out' in script[i]) {
        appendValidNode(inScript, script[i].in);
        appendValidNode(outScript, script[i].out);
      }


    }
    // indexの生成
    // 単語のsqueeze
    let index = [];
    let squeezedDict = [];
    let vocab = {};
    let line;

    for (let i = 0, l = inScript.length; i < l; i++) {
      line = textToInternalRepr(segmenter.segment(inScript[i].text));
      squeezedDict.push(...line);

      for (let j = 0, m = line.length; j < m; j++) {
        index.push(i);
        for (let word of line[j]) {
          vocab[word] = true;
        }
      }
    }
    // vocabの生成

    vocab = Object.keys(vocab)

    /* 
      Term Frequency: 各行内での単語の出現頻度
      tf(t,d) = (ある単語tの行d内での出現回数)/(行d内の全ての単語の出現回数の和)
    */

    //wv
    let wv = zeros(squeezedDict.length, vocab.length);
    for (let i = 0, l = squeezedDict.length; i < l; i++) {
      for (let word of squeezedDict[i]) {
        let pos = vocab.indexOf(word);
        if (pos !== -1) {
          wv.set([i, pos], wv.get([i, pos]) + 1);
        }
      }
    }

    // tf = wv / wv.sum(axis=0)
    const inv_wv = apply(wv, 1, x => divide(1, sum(x)));
    const tf = multiply(diag(inv_wv), wv);

    // """ Inverse Document Frequency: 各単語が現れる行の数の割合
    //
    //     df(t) = ある単語tが出現する行の数 / 全行数
    //     idf(t) = log(1 +1/ df(t) )  """

    const num_of_columns = tf.size()[0];
    const df = apply(wv, 0, x => sum(isPositive(x)) / num_of_columns);

    let idf = map(df, x => Math.log(1 + 1 / x));
    let tfidf = multiply(tf, diag(idf));

    // """
    // 正規化
    // すべてのtfidfベクトルの長さを1にする。これによりretrieveでnormの計算を
    // 毎回しないですむ"""

    const inv_n = apply(tfidf, 1, x => (divide(1, norm(x))));
    tfidf = multiply(diag(inv_n), tfidf);

    /* 
      messageのうち、
      person, mood, site, weather, season, dayPart,
      は one-hotベクターにする。これらをまとめてfeatureVector (fv)と呼ぶ。
      
    */

    fv = matrixFromColumns(inScript.map(i=>i.features));

    // 書き込み

    await db.saveCache(botId, partName,
      {
        outScript: outScript,
        vocab: vocab,
        wv: wv,
        idf: JSON.stringify(idf),
        tfidf: JSON.stringify(tfidf),
        index: index,
        fv: fv,
      });

  })();

  console.log("matrixize-end: ", botId, partName)

  postMessage({
    onmessage: true,
    partName: partName,
  });
};


