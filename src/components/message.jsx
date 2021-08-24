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
    weather ::= 'storm'|'heavyRain'|'rain'|'cloudy'|'halfClouds'|'sunny'|'heat'|'snowStorm'|'snow'| 
    season ::= 'spring'|'summer'|'autumn'|'winter'
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
  const msg = new Message("trigger","{TRIGGER_WEATHER_halfClouds}"})

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
  // person
  'bot': 1,
  'user': 2,
  'other': 3,
  'system': 4,
  //mood
  'peace': 5,
  'cheer': 6,
  'down': 7,
  'wake': 8,
  'absent': 9,
  'sleepy': 10,
  'sleep': 11,
  // site
  'room': 12,
  'forest': 13,
  'park': 14,
  // weather
  'storm': 15,
  'heavyRain': 16,
  'rain': 17,
  'cloudy': 18,
  'halfClouds': 19,
  'clear': 20,
  'heat': 21,
  'snowStorm': 22,
  'snow': 23,
  // season
  'spring': 24,
  'summer': 25,
  'autumn': 26,
  'winter': 27,
  //dayPart
  'morning': 28,
  '朝': 28,
  'noon': 29,
  '昼': 29,
  'evening': 30,
  '夕': 30,
  'night': 31,
  '夜': 31,
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
  'storm',
  'heavyRain',
  'rain',
  'cloudy',
  'halfClouds',
  'sunny',
  'heat',
  'snowStorm',
  'snow',
  // season
  'spring',
  'summer',
  'autumn',
  'winter',
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
  // msg = new Message('こんにちは\tbot room storm') 

  constructor(mode, data) {

    this.features = zeros(featureIndex.length);
    this.estimation = 0;

    if (data === undefined) {
      if (typeof mode === 'string') {
        // 第一引数に文字列だけを与えた場合
        // 辞書から取得した文字列をmessage化
        // 辞書にはタイムスタンプは記載せずseasonやdayPartに射影した情報を利用する。
        const line = mode.split('\t');
        this.text = line[0];
        this.name = ""
        this.timestamp = null;
        this.avatarPath = "";

        if (line.length > 1) {
          const feats = line[1].split(' ');
          for (let feat of feats) {
            if (feat in featureDict) {
              this.features[featureDict[feat]] = 1;
            }
          }
        }
      } else if (!Array.isArray(mode)) {
        // 第一引数にオブジェクトを与えた場合、
        // そのオブジェクトの値をコピー
        this.text = mode.text;
        this.name = mode.name;
        this.id = mode.id;
        this.timestamp = mode.timestamp;
        this.avatarPath = mode.avatarPath;
        if ("features" in mode) {
          this.features = [...mode.features];
        }
        else {
          if ("person" in mode) {
            this.setFeature(mode.person);
          }
          if ("mood" in mode) {
            this.setFeature(mode.mood);
          }
          if ("site" in mode) this.setFeature(mode.site);
          if ("ecosystem" in mode) {
            this.setFeature(data.ecosystem.weather);
            this.setFeature(data.ecosystem.dayPart);
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

  getFeature(start, end) {
    const pos = this.features.indexOf(1, start);
    if (start <= pos && pos <= end) {
      return featureIndex[pos]
    }
    return "";
  }

  setFeature(feat) {
    if (feat in featureDict) {
      this.features[featureDict[feat]] = 1;
    }
  }

  get person() { return this.getFeature(1, 4); }
  get mood() { return this.getFeature(5, 11); }
  get site() { return this.getFeature(12, 14); }
  get weather() { return this.getFeature(15, 23); }
  get season() { return this.getFeature(24, 27); }
  get dayPart() { return this.getFeature(28, 31); }

}

function zeros(size) {
  let a = Array(size);
  for (let i = 0; i < size; i++) {
    a[i] = 0;
  }
  return a;
}