/*
  スクリプトをmatrixに変換
  botId,partNameで指定されたスクリプトをdbから読み込む。
  スクリプトは
  [{in:[],out:[],prev,next}...]
  という形式で与えられ、
  という形式で与えられ、inputsは文字列またはmessage型データが有効である。
  Message型データは以下のようにコーディングする
  Message {
    text: 内部表現が渡され、それをベクトル化
    person, mood, site, weather, season, dayPart : one-hotベクター化
  }
  
  この関数は以下の計算結果を返す
  {
    index:　スクリプトの
  }
*/

import { db } from '../dbio';

import {
  zeros, divide, apply, sum,
  diag, multiply, isPositive, map, norm
} from "mathjs";
import { featuresDict } from '../../message.jsx';
import { getHourRad, getDateRad } from '../../calendar-rad';
import { textToInternalRepr } from '../internal-repr';
import {TinySegmenter} from '../tinysegmenter';

let segmenter = new TinySegmenter();



onmessage = function (event) {
  const { botId, partName } = event.data;

  console.log("matrixize-", botId, partName);
  (async () => {
    const script = await db.readScript(botId, partName);
    // inスクリプトとoutスクリプトに分割
    let inScript = [];
    let outScript = [];

    for (let i = 0, len = script.length; i < len; i++) {
      inScript.push(script[i].in);
      outScript.push(script[i].out);
    }
    // indexの生成
    // 単語のsqueeze
    let index = [];
    let squeezedDict = [];
    let vocab = {};
    let line;

    for (let i = 0, l = inScript.length; i < l; i++) {
      console.log("s",inScript[i])
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
      は one-hotベクターにする。dateRad,hourRadはradian値にする
      これらをまとめてfeatureVector (fv)と呼ぶ。
      
    */

    //fv - featureVectorの生成
    let fv = zeros(squeezedDict.length, featuresDict.length);
    for (let i = 0, l = script.length; i < l; i++) {
      const node = script[i];

      for (const x of [
        node.person,
        node.mood,
        node.site,
        node.weather,
        node.season,
        node.dayPart
      ]) {
        if (x in featuresDict) {
          fv[i][featuresDict[x]] = 1;
        }
      }

      const x = node.timestamp;
      if (x) {
        fv[i][featuresDict['dateRad']] = getDateRad(x);
        fv[i][featuresDict['hourRad']] = getHourRad(x);
      }
    }

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

  postMessage({
    onmessage: true,
    partName: partName,
  });
};


