/*
  Messageクラス
  ==================================
  発言や環境の変化など学習対象の情報を格納するクラス
  Messageの内容はtext、タイムスタンプ、特徴量からなる。
  textはユーザやチャットボットの発言かecosystemの変化などによって
  生じるトリガー文字列で、トリガーは {TRIGGER_ENTER_xx}のように表す。
  
    テキスト
    text ::= string // メッセージ本体 

    タイムスタンプ
    hourRad :: = rad // 24hを2πに換算したラジアン
    dateRad :: = rad // 1年を2πに換算したラジアン
    
    その他特徴量
    name ::= string // 発信者名 
    person ::= 'bot'|'user'|'other'|'system' // 発信者の種類
    mood ::= 'peace'|'cheer'|'down'|'absent'|'wake'|'sleepy'|'asleep' // 表情
    estimation ::= int // textが好意的なら＋、否定的ならーのスコア
    timestamp ::= Date() // メッセージが生成された時刻
    avatarPath ::= string // アバターのディレクトリ
    site ::= 'room'|'forest'|'park' // 現在地
    weather ::= '台風'|'大雨'|'雨'|'曇'|'晴'|'快晴'|'夏晴'|'吹雪'|'雪'| 
    season ::= '春'|'夏'|'秋'|'冬'
    dayPart ::= '朝'|'昼'|'夕'|'夜'


  使用法

  ## ユーザの発言
  const msg = new Message("speech",{
    text: "こんにちは",
    name: "しまりす",
    person: "user",
    mood: "peace", // 省略可, デフォルト "peace"
    avatarPath: "/avatar/person.svg"
  });

  発言時刻は自動で付与される。

  ## チャットボットの発言
  const msg = new Message("speech",{
    text: "やっほー",
    name: "しずく",
    person: "bot",
    mood: "cheer", // 省略可, デフォルト "peace"
    avatarPath: "/chatbot/shizuku/"
  });

  ## ecosystemが生成する環境の変化
  const msg = new Message("trigger","{TRIGGER_WEATHER_晴}"})

  ## チャットボットの内的状態の変化
  const msg = new Message("trigger",{
    trigger: "WAKEUP"
  })

  ## システムメッセージ
  const msg = new Message("system"),{
    text: "シマリスが退室しました"
  }

  # chatbot.jsonへの格納方法

  chatbot.jsonに格納する際に生のオブジェクトだと煩雑なので、以下の表記に変換する
  text\ttimestamp文字列,特徴量,特徴量, ... ,
*/

import { getHourRad, getDateRad } from "./calendar-rad";

export const featureDict = {
  // text
  'text': 0,
  // timestamp
  'hourRad': 1,
  'dateRad': 2,
  // person
  'bot': 3,
  'user': 4,
  'other': 5,
  'system': 6,
  //mood
  'peace': 7,
  'cheer': 8,
  'down': 9,
  'wake': 10,
  'absent': 11,
  'sleepy': 12,
  'sleep': 13,
  // site
  'room': 14,
  'forest': 15,
  'park': 16,
  // weather
  '台風': 17,
  '大雨': 18,
  '雨': 19,
  '曇': 20,
  '晴': 21,
  '快晴': 22,
  '夏晴': 23,
  '吹雪': 24,
  '雪': 25,
  // season
  '春': 26,
  '夏': 27,
  '秋': 28,
  '冬': 29,
  //dayPart
  'morning': 30,
  '朝':30,
  'noon': 31,
  '昼': 31,
  'evening': 32,
  '夕': 32,
  'night': 33,
  '夜': 33,
};

export const featureIndex = [
  'text',
  // person
  'bot',
  'user',
  'other',
  'system',
  //mood
  'peace',
  'cheer',
  'down',
  'wake',
  'absent',
  'sleepy',
  'sleep',
  // site
  'room',
  'forest',
  'park',
  // weather
  '台風',
  '大雨',
  '雨',
  '曇',
  '晴',
  '快晴',
  '夏晴',
  '吹雪',
  '雪',
  // season
  '春',
  '夏',
  '秋',
  '冬',
  //dayPart
  'morning', // 日の出から240分間
  'noon', // 日の出240分後〜日没まで
  'evening', // 日没前120分〜日没後120分
  'night', // 日没後121分〜日の出まで
];

export class Message {
  // Messageクラスの様々な生成法
  // msg = new Message('speech',{text:"こんにちは",name:"アレス", ...})
  // msg = new Message('trigger','{TRIGGER_ENTER_SLEEP}');
  // msg = new Message('system','{})
  // msg = new Message('こんにちは\tbot room 台風') 

  constructor(mode, data) {

    this.features = zeros(featureIndex.length);
    this.estimation = 0;

    if (data === undefined) {
      // 第一引数だけ与えられた場合は辞書から取得した文字列をMessageに復元。
      // 辞書にはタイムスタンプは記載せずseasonやdayPartに射影した情報を利用する。
      const data = mode.split('\t');
      this.text = data[0];
      this.name = ""
      this.timestamp = null;
      this.avatarPath = "";

      if (data.length > 1) {
        const feats = data[1].split(' ');
        for (let feat of feats) {
          if (feat in featureDict) {
            this.features[featureDict[feat]] = 1;
          }
        }
      }
      
    } else {
      switch (mode) {
        case 'speech': {
          this.text = data.text;
          this.name = data.name;
          this.timestamp = new Date();
          this.avatarPath = data.avatarPath;

          this.setFeature(data.person);
          this.setFeature(data.mood || "peace");
          this.setFeature(data.site);
          this.setFeature(data.ecosystem?.weather);
          this.setFeature(data.ecosystem?.dayPart);
          break;
        }

        case 'trigger': {
          this.text = data;
          this.name = null;
          this.timestamp = new Date();
          this.avatarPath = "";

          this.setFeature(data.person);
          this.setFeature(data.mood);
          this.setFeature(data.site);
          this.setFeature(data.ecosystem?.weather);
          this.setFeature(data.ecosystem?.dayPart);

          break;
        }

        default: {
          this.text = data.text;
          this.name = mode;
          this.timestamp = new Date();
          this.avatarPath = "";

          break;
        }
      }
    }
  }

  get hourRad() {
    return getHourRad(this.timestamp);
  }

  get dateRad() {
    return getDateRad(this.timestamp);
  }

  getFeature(start,end){
    const pos = this.features.indexOf(1,start);
    if(start<=pos && pos<=end){
      return featureIndex[pos]
    }
    return "";
  }

  setFeature(feat){
    if (feat){
      this.features[featureDict[feat]] = 1;
    }
  }

  get person() { return this.getFeature(3,6); }
  get mood(){ return this.getFeature(7,13); }
  get site(){ return this.getFeature(14,16); }
  get weather(){ return this.getFeature(17,25); }
  get season(){ return this.getFeature(26,29); }
  get dayPart(){ return this.getFeature(30,31); }

}

function zeros(size){
  let a = Array(size);
  for(let i=0;i<size;i++){
    a[i] = 0;
  }
  return a;
}