
import {
  zeros, divide, apply, sum,
  diag, multiply, isPositive, map, norm
} from "mathjs";
import { Message, featuresDict } from '../../message.jsx';
import { getHourRad,getDateRad} from '../../calendar-rad';

export async function matrixize(script){
  /*
    スクリプトをmatrixに変換
    スクリプトは
    [ ...inputs ]
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
  
  // indexの生成
  // 単語のsqueeze
  let index = [];
  let squeezedDict = [];
  let vocab = {};

  for (let i = 0, l = script.length; i < l; i++) {
    let line = script[i].text;

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
    let x = node.person;
    if(x in featuresDict){
      fv[i][featuresDict[x]] = 1;
    }

    x = node.mood;
    if(x in featuresDict){
      fv[i][featuresDict[x]] = 1;
    }

    x = node.site;
    if(x in featuresDict){
      fv[i][featuresDict[x]] = 1;
    }

    x = node.weather;
    if(x in featuresDict){
      fv[i][featuresDict[x]] = 1;
    }

    x = node.season;
    if(x in featuresDict){
      fv[i][featuresDict[x]] = 1;
    }
    
    x = node.dayPart;
    if(x in featuresDict){
      fv[i][featuresDict[x]] = 1;
    }   

    x = node.timestamp;
    if(x) {
      fv[i][featureDict['dateRad']] = getDateRad(x);
      fv[i][featureDict['hourRad']] = getHourRad(x);
    }
  }

  // matrixは直に渡すとObject型になってしまうのでシリアライズ
  // 受け取る側で
  // import {reviver} from 'mathjs';
  // const x = JSON.parse(v.idf,reviver);
  // とすると復元できる。

  return {
    vocab: vocab,
    wv: JSON.stringify(wv),
    idf: JSON.stringify(idf),
    tfidf: JSON.stringify(tfidf),
    index: JSON.stringify(index),
    fv: JSON.stringify(fv),
  };
}

