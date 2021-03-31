/*
  BiomeBot
  =====================
  複数の「心のパート」が競争的に動作するチャットボットエンジン

  ## 概要

  ### 精神レベルとモーメント
  
  チャットボットは好意的な反応をもらうと精神性や精神的な活力が向上し、
  否定的な影響を受けるとそれらが低下する。mentalLevelはそれを表す
  パラメータで、学習と会話の完了で数値が上昇し、値は次回の会話にも
  引き継がれる。momentは最小値を0、最大値をmentalLevelとする値で
  一回の会話の中ごとに0からスタートし、ユーザから肯定的な反応を得ると
  増加、否定的な反応を得ると減少する。

  チャットボットは機能の異なる複数の「パート」がリストを形成して動作し
  返答を生成する。すべてのパートは共通して、
  1. momentがupperMoment,lowerMomentの範囲内にあれば
     辞書内の各行について入力との類似度を調べる。
  2. 類似度が正確性precisionよりも高ければ返答する
  3. 継続率retentionよりも乱数が小さければこのパートは先頭に移動し、
     大きければ末尾に移動する。
  という機序で動作する。

  ### パートにおける刺激に対する応答

  人の心の中には様々な「心のパート」があり、それらが外界から刺激を受けて
  最も強く反応したものがアクティブ状態となり返答を行なっている。この外界とは
  入力とその発言者（自分、オーナー、第三者）、発言内容の評価(肯定的/否定的)、
  天候の変化、場所の変化、季節の変化が含まれ、チャットボット自身が発言した
  ことを聞いて反応する場合も含まれる。
  
  刺激を受けた場合、心のパートは返答の候補を辞書の中から探す。
  辞書はINとOUTが対になっており、INと入力が最も似ている場合、そのOUTを
  出力とする。外部からの刺激及びINは文字列、発言者(自分、オーナー、第三者)、
  hourRad,TimeRad,season,weather,dayPartで構成される。
  文字列自身を含む全ての特徴量にはそれぞれ非負の重みとバイアスがあり、
  将来的には機械学習でその値の最適化を行う事ができるが、現バージョンでは
  設計時に与えた初期値をそのまま使用する。

  ### 発言内容の肯定的/否定的評価（ラベル付け）
  
  momentの上下や学習・忘却を実行するために入力文字列は常にラベル付の評価を
  行う。それにはメイン辞書の{NEGATIVE_LABEL},{POSITIVE_LABEL}を利用し、
  まず{NEGATIVE_LABEL}に含まれる単語１つに付き-1点のスコアを計算する。
  スコアの合計がマイナスであればそれを採用し、0点であれば
  {POSITIVE_LABEL}に含まれる単語１つに付き+1点のスコアを計算する。
  このスコアが0でなければこれを採用する。0点であれば文字列が長いほど
  高い得点となるスコアを与える。
  


  ### チャットボットの状態 mood
  アプリケーション起動時、チャットボットはMain辞書の {!onStart} を実行する。
  そこに下記のアクションをおいておくことで開始状態に変化をもたせる。
  
  #### 基本のアクション（チャットボットのアバターを変えるもの）

  | action    | mood   | 内容
  |-----------|--------|----------------------------------------
  | {!PEACE}  | peace  | 何もしない
  | {!DOWN}   | down   | momentが0にセットされる
  | {!CHEER}  | cheer  | momentが0~mentalLevelの間のランダム値増加する
  | {!SLEEP}  | sleep  | 昼なら5秒後に{!onWakeup__}が実行される
  | {!ABSENT} | absent | 昼なら5〜100秒後に{__onComeback__}が実行される
  
  #### 既定のアクション

  以下のアクションがパートで定義されていたらそれを実行する。
  見つからなければメイン辞書に書かれた定義を実行する。
  どこにもなければ無視する。

  | action        | 内容
  |---------------|------------------------
  | {!onStart}    | アプリ開始時に自動実行
  | {!end}        | 会話終了時にユーザが実行
  | {!onWakeup}   | 起床時刻になったら自動実行。
  | {!onSleep}    | 就寝時刻になったら自動実行。
  | {!onComeback} | 外出からの帰還時に自動実行
  | {!onSunrise}  | 昼に切り替わったときに自動実行
  | {!onSunset}   | 夜に切り替わったときに自動実行


  その他、Ecosystemの変化に対応し、{!onCloudyBegin}のようなアクションが
  定義されていればそれが実行される。

  ## Responder
  
  一問一答形式の辞書を使用し、知っていることを答えたり反応したりする。
  

  
  ## Learner

  一問一答形式の辞書を使用し、ユーザに知らない言葉を聞いて学習し、
  学習した内容を用いて返答する

  ## Storyteller

  エピソード記憶型の辞書を使用し、聞いたこと

  learnerの動作自体をスクリプト化できないか？

*/
import {textToInternalRepr, dictToInternalRepr} from "./internalRepr";
import {TinySegmenter} from "./tinysegmenter";
import BiomebotBase from "./biomebotBase";

import {Message} from "./message";

// estimate()でポジティブ・ネガティブな単語がなかった場合、
// len(nodes) ^ ESTIMATOR_LEENGTH_FACTORをスコアとする 
const ESTIMATOR_LENGTH_FACTOR = 0.6; 

const segmenter = new TinySegmenter();
// 注記: [<>{}+-]がアルファベットに分類されるよう変更したものを使用


export default class Biomebot extends BiomebotBase {
  constructor() {
    super();
    this.site = null;
  }

  async deploy(site){
    /* 
      チャットボット実行のための準備    
    */
    if(site === this.site) return;
    await this.readEstimator();
  }
  
  async reply(input) {
    /* Message型オブジェクトinputを受け取り返答を生成する */

    // textを内部表現に
    const nodes = segmenter.segment(input.text);
    input.text = textToInternalRepr(nodes);
    
    // 評価スコア計算
    input.estimate = this.estimate(input.text);
    
    const output = new Message('speech',{
      text: `echo ${input.text}:est=${input.estimate}`,
      name: this.displayNameCache,
    })
    return output;

  }

  async estimate(text){
    /* 内部表現化されたテキストに含まれるネガティブ/ポジティブワードを
      見つけてスコアを与える。
      テキストに含まれたポジティブなワードを優先して評価し、
      ポジティブなワードが見つからない場合ネガティブなワードの数を評価する。
      どちらも含まない場合は長い文字列ほどポジティブとし、文字列の長さをlと
      したとき

      score = 
      */
    let score = 0;
    const pos = this.estimater.positives;
    const neg = this.estimater.negatives;
    
    score = text.reduce((score, word) => (score + word in pos ? 1 : 0), 0);
    if(score !== 0) return score;

    score = text.reduce((score, word) => (score + word in neg ? -1 : 0), 0);
    if(score !== 0) return score;

    return Math.round(text.length ^ ESTIMATOR_LENGTH_FACTOR);   
  }

}