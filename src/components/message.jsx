/*
  Messageクラス
  ==================================
  発言や環境の変化など学習対象の情報を格納するクラス
    text ::= string // メッセージ本体 
    name ::= string // 発信者名 
    person ::= 'bot'|'user'|'other'|'system' // 発信者の種類
    mood ::= 'peace'|'cheer'|'down'|'absent'|'sleep' // 表情
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
  const msg = new Message("eco",{
    text: "天気が晴れになった", // 省略可
    kind: "weather",
    value: "晴"
  })

  ## システムメッセージ
  const msg = new Message("system"),{
    text: "シマリスが退室しました"
  }

*/

import { getHourRad, getDateRad } from "./calendar-rad";

export const featuresDict = {
  // person
  'bot': 1,
  'user': 2,
  'other': 3,
  'system': 4,
  //mood
  'peace': 5,
  'cheer':6,
  'down':7,
  'absent':8,
  'sleepy':9,
  'sleep':10,
  // site
  'room': 11,
  'forest': 12,
  'park': 13,
  // weather
  '台風':14,
  '大雨':15,
  '雨':16,
  '曇':17,
  '晴':18,
  '快晴':19,
  '夏晴':20,
  '吹雪':21,
  '雪':22,
  // season
  '春':23,
  '夏':24,
  '秋':25,
  '冬':26,
  //dayPart
  '昼':27,
  '夜':28,
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

      case 'eco': {
        this.text = data.text || "";
        this.name = null;
        this.person = null;
        this.mood = null;
        this.trigger = `${data.kind},${data.value}`;
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
}