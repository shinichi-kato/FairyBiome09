/*
matrixize.worker

usage:
  worker.postMessage({ botId, partName });

botId, partNameで指定されたスクリプトをdbから読み、
tfidf類似度計算のためのキャッシュを生成してdbに書き込む。


  # スクリプト
  スクリプトはchatbot.jsonの中で以下のように記述される。
  
  "script": [
      {
          "in": ["弱気だって言われた","優柔不断だって言われた"],
          "out": "{user}さんは優しいんですよ。"
      },
      {
          "in": "{enter_storm}",
          "out":["台風みたいです！","すごい風と雨になってきました"]
      },
  ]

  inは入力文字列、outはinを受け取ったときの出力文字列で、in,outともに複数の候補が
  あってもよく、候補が複数の場合は文字列のリスト、一つの場合は文字列で記述する。

  Message型データは以下のようにコーディングする
  Message {
    text: 内部表現化
    features: [person, mood, site, weather, season, dayPart, ... ]  one-hotベクター化
  }

  textは行ごとに正規化されたtfidf行列に変換する。
  retrieve関数ではMessage.textに対して類似度(内積)を計算し、得られた1次元のスコアベクターに
  特徴量行列をconcatする。
  得られた全体のスコア行列について score = score*weights + biases という重み付け計算を行って
  その中でscoreが最大のものを選出する。

  この関数は以下の計算結果を返す
  {
    index:　inとoutの数は必ずしも同じでないため、inscriptのi行がoutscriptのo行に対応することをindex[i]=oで格納
  }

  ## トリガー
  入力文字列が "{enter_storm}"のように{}で囲まれた半角英数のコマンドである場合は
  ecosystemの変化を示すトリガーなどである。トリガーは曖昧な検索が必要ないが
  一般の文字列と同様に単純化のためtfidfを使った検索を利用する。
  
*/

import {
  zeros, divide, apply, sum,
  diag, multiply, isPositive, map, norm
} from "mathjs";

import { db } from '../dbio';
import { Message } from '../../message';
import { textToInternalRepr } from '../internal-repr';
import { TinySegmenter } from '../tinysegmenter';

let segmenter = new TinySegmenter();


function getValidNode(node) {
  if (typeof node === 'string') {
    return [new Message(node)];
  }
  else if (Array.isArray(node) && node.length !== 0) {
    return node.map(n => new Message(n));
  }
  return [];
}

function isNonEmpty(node) {
  return node !== "" && (Array.isArray(node) && node.length !== 0)
}

onmessage = function (event) {
  const { botId, partName } = event.data;

  console.log("matrixize-start: ", botId, partName);
  (async () => {
    const script = await db.readScript(botId, partName);
    // inスクリプトとoutスクリプトに分割
    let inScript = [];
    let outScript = [];

    // inスクリプトとoutスクリプトに分割
    for (let i = 0, len = script.length; i < len; i++) {
      let line = script[i];
      if ('in' in line && 'out' in line) {
        if (isNonEmpty(line.in) && isNonEmpty(line.out)) {
          inScript.push(getValidNode(line.in))
          outScript.push(getValidNode(line.out))
        }
      }
    }

    console.log(partName, ": loaded in=", inScript.length, "out=", outScript.length, "entries")

    // inScriptは辞書の1エントリに対して複数の入力,複数の出力があってもよい。tfidfや
    // fvは入力につき1つ定義され、入力にどのoutScirptおよびfvが対応するかを示す
    // indexを用意する。
    // 
    // indexの生成
    // 単語のsqueeze
    // fvの生成

    let index = [];
    let squeezedDict = [];
    let vocab = {};
    let line;
    let fv = [];

    for (let i = 0, l = inScript.length; i < l; i++) {
      // 
      let inScript2 = inScript[i];
      for (let i2 = 0, l2 = inScript2.length; i2 < l2; i2++) {
        let entry = inScript2[i2];
        line = textToInternalRepr(segmenter.segment(entry.text));
        squeezedDict.push(...line);
        index.push(i);
        fv.push(entry.features);

        for (let j = 0, m = line.length; j < m; j++) {
          for (let word of line[j]) {
            vocab[word] = true;
          }
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
    console.log("wv", squeezedDict.length, vocab.length)
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


    // 書き込み


    await db.saveCache(botId, partName,
      {
        outScript: outScript,
        vocab: vocab,
        wv: wv,
        idf: idf,
        tfidf: tfidf,
        index: index,
        fv: fv,
      });

    console.log("matrixize-end: ", botId, partName)

    postMessage({
      onmessage: true,
      partName: partName,
    });

  })();

};


