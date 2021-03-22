/*
  Messageクラス
  ==================================
  発言や環境の変化など学習対象の情報を格納するクラス

  使用法

  ## ユーザの発言
  const msg = new Message("speech",{
    text: "こんにちは",
    name: "しまりす",
    person: "user",
    mood: "peace", // 省略可, デフォルト "peace"
  });

  発言時刻は自動で付与される。

  ## チャットボットの発言
  const msg = new Message("speech",{
    text: "やっほー",
    name: "しずく",
    person: "bot",
    mood: "cheer", // 省略可, デフォルト "peace"
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

import {getHourRad, getDateRad} from "../calendar-rad";

export class Message {
  constructor(mode, data){
    switch(mode){
      case 'speech': {
        this.text = data.text;
        this.name = data.name;
        this.person = data.person;
        this.mood = data.mood || "peace";
        this.trigger = null;
        this.estimate = 0;
        this.site = data.site;
        this.timestamp = new Date();
        if(data.ecosystem){
          this.ecosystem = {...data.ecosystem}
        }

        break;
      }

      case 'eco': {
        this.text = data.text || "";
        this.name = null;
        this.person = null;
        this.mood = null;
        this.trigger = {kind: data.kind, value: data.value};
        this.site = data.site;
        this.estimate = 0;
        this.timestamp = new Date();
        if(data.ecosystem){
          this.ecosystem = {...data.ecosystem}
        }

        break;
      }

      case 'system': {
        this.text = data.text;
        this.name = null;
        this.person = null;
        this.mood = null;
        this.trigger = null;
        this.site = data.site;
        this.estimate = 0;
        this.timestamp = new Date();

        break;       
      }

      default:
        throw new Error(`invalid message mode ${mode}`);
    }

  }

  get hourRad(){
    return getHourRad(this.timestamp);
  }

  get dateRad(){
    return getDateRad(this.timestamp);
  }
}