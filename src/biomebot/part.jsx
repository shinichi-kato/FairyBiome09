import { randomInt } from "mathjs";
import { TinySegmenter } from "./tinysegmenter.js";
import { textToInternalRepr, dictToInternalRepr } from "./internalRepr.js";
import matrixizeWorker from "./matrixizeWorker";
import vectorizeWorker from "./vectorizeWorker";

import PartBase from "./partBase";
import { getDateRad, getHourRad } from '../calendar-rad';

const segmenter = new TinySegmenter();
// 注記: [<>{}+-]がアルファベットに分類されるよう変更したものを使用


export default class Part extends PartBase {
  /*
    Partクラス
    =============

    Partはチャットボットの心を構成する個々の「心のパート」を実装する。
    Partはどのように動作するかを表すパラメータ、および入力に対してどのような返答を
    生成するかを決めるスクリプト（辞書）からなる。
    
    ## 動作を決めるパラメータ
    * モーメントバンド(momentBand)
    チャットボットには現在の心のエネルギー値を示す moment があり、reply()に与え
    られたmoment値が momentUpper と momentLower の間に
    なっている必要がある。これにより会話の温まりや学習の程度に応じた反応が可能になる。

    * 正確度(precision, 0〜1)
    入力を受け取るとPartは辞書を検索して似ているデータを探す。このとき0〜1の類似度が
    計算される。Partは類似度がprecisionよりも高い場合に一致したとみなし、返答を
    生成する。

    * 継続率(retention, 0〜1)
    返答を生成したPartはpartOrderの先頭に移動することで、次回も優先的に実行される。
    継続率は返答生成後にpartOrderの先頭に移動するかどうかの可能性で、rand()値が
    継続率より小さかった場合このpartはpartOrderの先頭に移動する。


    ## 入力
    一つの入力データにはテキスト、タイムスタンプ、天候、場所、相手などの特徴量が含まれる。
    スクリプト中ではこれを以下のように表現する。
    
    "テキスト\t2021/11/12 16:30:12.112,晴れ,森,1"

    フィールドはテキスト、タイムスタンプ、環境情報にタブ文字で分ける。
    これらを以下のように変換して検索の特徴量にする。
    テキストは形態素解析を行なってword vectorに変換する。タイムスタンプは
    YYYY/MM/DD hh:mm:ss.sss または MM/DD hh:mm のどちらかの形式とする。ここ
    から月/日と時:分を取り出し、それぞれrad(0〜2π)に変換する。天候、場所、相手などの
    環境情報はそれぞれ内部的に1-hotベクターに変換する。なお環境情報を省略した場合は
    全てが1になるベクターに置き換えられ、環境による影響を受けないように評価される。
        
    特徴量ごとに重み付けの係数があり、将来的には機械学習による係数の最適化を
    行えるようにする。


    ## partスクリプトの形式

    [
      {"in":["今日は  11/12 16:30,,森"],"out":["こんにちは！"]},

    ]
    

    ## Lazy loading
    活性化バンドの制約によりチャットボット起動時には必ずしもすべてのpartが実行可能である
    必要がない。そのためreply()が実行された時点で辞書のコンパイルを行う。

  */

  compile = async () => {
    // scriptをencoder(入力),renderer(出力)に分割。
    // 入力はテキスト、月/日、時:分、環境情報リストに分割。
    let encoder = this.script.map(nodes =>
      (
        nodes.in.map(node => {
          const n = node.in.split('\t');
          const feats = n[1].split(',');
          const [datestr, timestr] = feats[0].split(' ');
          const [month, date] = datestr.split('/').slice(-2);
          const [hour, min] = timestr.split(':').slice(0, 2);
          
          // テキストの分かち書き
          let text = segmenter.segment(n[0]);

          // 内部表現に変換
          text = textToInternalRepr(text);

          return {
            text: text,
            dateRad: getDateRad(month, date),
            hourRad: getHourRad(hour, min),
            env: feats.slice(1)
          }
        })
      ));

    this.renderer = this.script.map(node => (node.out));

    // 正規化tfidf行列、vocab、indexの生成
    let matrix = await matrixizeWorker.matrixize(encoder);

    // envの1-hot-vector化
    matrix = await vectorizeWorker.vectorize(encoder);
    
  }

}