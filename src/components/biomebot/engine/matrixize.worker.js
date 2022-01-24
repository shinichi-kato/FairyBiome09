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
  スクリプトのinはユーザ入力との類似度計算をするためMessage型に変換する。

  Message型データは以下のようにコーディングする
  Message {
    text: 内部表現化
    features: [person, mood, site, weather, season, dayPart, ... ]  one-hotベクター化
  }

  textは行ごとに正規化されたtfidf行列に変換する。
  retrieve関数ではMessage.textに対して類似度(内積)を計算し、得られた1次元のスコアベクターに
  特徴量行列をconcatする。  得られた全体のスコア行列について score = score*weights + biases 
  という重み付け計算を行い、その中でscoreが最大のものを選出する。

  一方出力文字列はfeatureが環境によって与えられるためキャッシュにはstringだけを格納する。

  この関数は以下の計算結果を生成し、dbに書き込む。
  {
    outScript: 出力文字列のリスト
    vocab: 辞書に現れる全ての単語のリスト。
    wv: 入力文字列を単語のindexで表した行列
    idf: idf値,
    tfidf: tfidf行列,
    index: inscriptの行とoutscriptの行の対応を記述したリスト,
    fv: fv, 入力をfeatureで表した行列
    tagDict: 入力文字列が{...}であるエントリを辞書化したもの
  }

  ## タグ及びトリガー
  入力文字列が "{enter_storm}"のように正規表現/^{[a-z_]+}$/で示される入力文字列は
  ecosystemの変化を示すトリガーなどである。トリガーは曖昧な検索が必要ないが
  一般の文字列と同様に単純化のためtfidfを使った検索を利用する。
  一方正規表現/^{[A-Z_]+}$/で示される入力文字列はタグで、出力文字列に含まれる場合再帰的に展開される。
  スクリプトの入力文字列がtagだった場合はそれに対応するoutScriptの文字列をtagDictに格納する。

  
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

const reTag = /^{[A-Z_]+}$/;


function getValidNode(node) {
  if (typeof node === 'string') {
    return [new Message(node)];
  }
  else if (Array.isArray(node) && node.length !== 0) {
    return node.map(n => new Message(n));
  }
  return [];
}

function getValidList(node){
  if (typeof node === 'string') {
    return [node];
  }
  else if (Array.isArray(node)){
    return node
  }
}

function isNonEmpty(node) {
  return typeof node === "string" || (Array.isArray(node) && node.length !== 0)
}

function findTag(node) {
  if (typeof node === 'string') {
    let found = node.match(reTag);
    if (found) {
      return found[0];
    }
  }
  return false;
}

onmessage = function (event) {
  const { botId, partName } = event.data;

  console.log("matrixize-start: ", botId, partName);
  (async () => {
    const script = await db.loadScript(botId, partName);
    // inスクリプトとoutスクリプトに分割
    let inScript = [];
    let outScript = [];
    let tagDict = {};

    // inスクリプトとoutスクリプトに分割
    for (let i = 0, len = script.length; i < len; i++) {
      let line = script[i];
      if ('in' in line && 'out' in line) {
        if (isNonEmpty(line.in) && isNonEmpty(line.out)) {
          inScript.push(getValidNode(line.in))

          let out = getValidList(line.out);
          outScript.push(out);
          let tag = findTag(line.in);
          if (tag) {
            tagDict[tag] = out;
          }
        }
      }
    }

    // console.log(partName, ": loaded in=", inScript, "out=", outScript.length, "entries", "tagDict", tagDict)

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

      let inScript2 = inScript[i];
      for (let i2 = 0, l2 = inScript2.length; i2 < l2; i2++) {

        let message = inScript2[i2];
        line = textToInternalRepr(segmenter.segment(message.text));
        squeezedDict.push(line);
        index.push(i);
        
        fv.push(message.features);

        for (let word of line) {
          vocab[word] = true;
        }
      }
    }

    // vocabの生成

    const vocabKeys = Object.keys(vocab);
    
    for(let i=0,l=vocabKeys.length; i<l; i++){
      vocab[vocabKeys[i]] = i;
    }
    /* 
      Term Frequency: 各行内での単語の出現頻度
      tf(t,d) = (ある単語tの行d内での出現回数)/(行d内の全ての単語の出現回数の和)
    */

    let wv = zeros(squeezedDict.length, vocabKeys.length);
    for (let i = 0, l = squeezedDict.length; i < l; i++) {

      for (let word of squeezedDict[i]) {
        let pos = vocab[word];
        if (pos !== undefined) {
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
    // console.log("matrixize: tf=",tf,"df=",df)
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
        tagDict: tagDict,
      });

    console.log("matrixize-end: ", botId, partName)

    postMessage({
      onmessage: true,
      partName: partName,
    });

  })();

};


