/*
  BiomeBot
  =====================
  複数の「心のパート」が競争的に動作するチャットボットエンジン

  ## 概要

  ### 精神レベルとモーメント
  チャットボットは好意的な反応をもらうと精神性や精神的な活力が向上し、
  否定的な影響を受けるとそれらが低下する。mentalLevelはそれを表す
  パラメータで、学習や肯定的な影響で数値が上昇し、値は次回の会話にも
  引き継がれる。momentは最小値を0、最大値をmentalLevelとする値で
  一回の会話の中ごとに0からスタートし、やり取りをするごとに増加する。

  各パートは
  1. momentがupperMoment,lowerMomentの範囲内にあれば
     辞書内の各行について入力との類似度を調べる。
  2. 類似度が正確性precisionよりも高ければ返答する
  3. 継続率retentionよりも乱数が小さければこのパートは先頭に移動し、
     大きければ末尾に移動する。
  という機序で動作する、
  
  ### パートにおける刺激に対する応答
  人の心の中には様々な「心のパート」があり、それらが外界から刺激を受けて
  最も強く反応したものがアクティブ状態となり返答を行なっている。この外界とは
  入力とその発言者（自分、オーナー、第三者）、天候の変化、場所の変化、
  季節の変化が含まれ、チャットボット自身が発言したことを聞いて反応する場合も
  含まれる。
  
  刺激を受けた場合、心のパートは返答の候補を辞書の中から探す。
  辞書はINとOUTが対になっており、INと入力が最も似ている場合、そのOUTを
  出力とする。外部からの刺激及びINは文字列、発言者(自分、オーナー、第三者)、
  hourRad,TimeRad,season,weather,dayPartで構成される。
  文字列自身を含む全ての特徴量にはそれぞれ非負の重みとバイアスがあり、
  将来的には機械学習でその値の最適化を行う事ができるが、現バージョンでは
  設計時に与えた初期値をそのまま使用する。

  ### チャットボットの状態 mood
  アプリケーション起動時、チャットボットはMain辞書の {__start__} を実行する。
  そこに下記のアクションをおいておくことで開始状態に変化をもたせる。
  
  #### 基本のアクション（チャットボットのアバターを変えるもの）

  | action       | mood   | 内容
  |--------------|--------|----------------------------------------
  | {__PEACE__}  | peace  | 何もしない
  | {__DOWN__}   | down   | momentが0にセットされる
  | {__CHEER__}  | cheer  | momentが0~mentalLevelの間のランダム値になる
  | {__SLEEP__}  | sleep  | 昼なら5秒後に{__onWakeup__}が実行される
  | {__ABSENT__} | absent | 昼なら5〜100秒後に{__onComeback__}が実行される
  
  #### 既定のアクション

  以下のアクションがパートで定義されていたらそれを実行する。
  見つからなければメイン辞書に書かれた定義を実行する。
  どこにもなければ無視する。

  | action           | 内容
  |------------------|------------------------
  | {__onStart__}    | アプリ開始時に自動実行
  | {__end__}        | 会話終了時にユーザが実行
  | {__onWakeup__}   | 起床時刻になったら自動実行。
  | {__onSleep__}    | 就寝時刻になったら自動実行。
  | {__onComeback__} | 外出からの帰還時に自動実行
  | {__onMorning__}  | 
  
  ## Responder
  
  一問一答形式の辞書を使用し、知っていることを答えたり反応したりする。
  

  
  ## Learner

  一問一答形式の辞書を使用し、ユーザに知らない言葉を聞いて学習し、
  学習した内容を用いて返答する

  ## Storyteller

  エピソード記憶型の辞書を使用し、聞いたこと

  learnerの動作自体をスクリプト化できないか？

*/    
import BiomebotBase from "./biomebotBase";

export default class Biomebot extends BiomebotBase {
  constructor() {
    super();
    this.site = null;
  }

  async deploy(site){
    /* 
      siteで指定したチャットボットをデプロイし、
      成功したらsiteを返す。
    */
    if (site === this.site) return false;
    let status = null;
    switch(site) {
      case 'room': 
        status = await this.deployHome();
        break;
    
      case 'forest':
        status = await this.deployForest();
        break;
    
      case 'park':
        status = await this.deployPark();
        break;
      default:
        throw new Error(`invalid site ${site}`);
    }

    if(status === 'ok'){
      this.site = site;
    }
    return site;
  }

  async deployHome(){
    /*
      ユーザのチャットボットが
    */
   return 'ok';
  }

  async deployForest(){
    return 'ok';
  }

  async deployPark(){
    return 'ok';
  }



}