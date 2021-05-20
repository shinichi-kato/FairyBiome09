/*
  Messageクラス
  ==================================
  発言や環境の変化など学習対象の情報を格納するクラス
    text ::= string // メッセージ本体 
    name ::= string // 発信者名 
    person ::= 'bot'|'user'|'other'|'system' // 発信者の種類
    mood ::= 'peace'|'cheer'|'down'|'absent'|'wake'|'sleepy'|'asleep' // 表情
    trigger ::= string // ecosystemの変化など
    estimation ::= int // textが好意的なら＋、否定的ならーのスコア
    timestamp ::= Date() // メッセージが生成された時刻
    avatarPath ::= string // アバターのディレクトリ
    site ::= 'room'|'forest'|'park' // 現在地
    weather ::= '台風'|'大雨'|'雨'|'曇'|'晴'|'快晴'|'夏晴'|'吹雪'|'雪'| 
    season ::= '春'|'夏'|'秋'|'冬'
    dayPart ::= '昼'|'夜'


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
  const msg = new Message("trigger",{
    text: "天気が晴れになった", // 省略可
    trigger: "{WEATHER_晴}",
  })

  ## チャットボットの内的状態の変化
  const msg = new Message("trigger",{
    trigger: "WAKEUP"
  })

  ## システムメッセージ
  const msg = new Message("system"),{
    text: "シマリスが退室しました"
  }

*/

import { getHourRad, getDateRad } from "./calendar-rad";

export const featuresDict = {
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
  'cheer':8,
  'down':9,
  'wake':10,
  'absent':11,
  'sleepy':12,
  'sleep':13,
  // site
  'room': 14,
  'forest': 15,
  'park': 16,
  // weather
  '台風':17,
  '大雨':18,
  '雨':19,
  '曇':20,
  '晴':21,
  '快晴':22,
  '夏晴':23,
  '吹雪':24,
  '雪':25,
  // season
  '春':26,
  '夏':27,
  '秋':28,
  '冬':29,
  //dayPart
  '昼':30,
  '夜':31,

};

export class Message {
  constructor(mode, data) {
    switch (mode) {
      case 'speech': {
        this.text = data.text;
        this.name = data.name;
        this.person = data.person;
        this.mood = data.mood || "peace";
        this.trigger = null;
        this.estimation = 0;
        this.timestamp = new Date();
        this.avatarPath = data.avatarPath;
        this.site = data.site;
        this.weather = data.ecosystem?.weather || "";
        this.season = data.ecosystem?.season || "";
        this.dayPart = data.ecosystem?.dayPart || "";
        break;
      }

      case 'trigger': {
        this.text = data.text || "";
        this.name = null;
        this.person = null;
        this.mood = null;
        this.trigger = `${data.trigger}`;
        this.site = data.site;
        this.estimate = 0;
        this.timestamp = new Date();
        this.weather = data.ecosystem?.weather || "";
        this.season = data.ecosystem?.season || "";
        this.dayPart = data.ecosystem?.dayPart || "";

        break;
      }

      default:  {
        this.text = data.text;
        this.name = mode;
        this.person = null;
        this.mood = null;
        this.trigger = null;
        this.site = data.site;
        this.estimate = 0;
        this.timestamp = new Date();
        this.weather = "";
        this.season = "";
        this.dayPart = "";
        break;
      }
    }

  }

  get hourRad() {
    return getHourRad(this.timestamp);
  }

  get dateRad() {
    return getDateRad(this.timestamp);
  }

  get featVector() {
    let fv = Array(featuresDict).fill(0);
    for(const x of [
      this.person,
      this.mood,
      this.site,
      this.weather,
      this.season,
      this.dayPart
    ]) {
      if(x in featuresDict){
        fv[featuresDict[x]] = 1;
      }
    }
    return fv;
  }
}