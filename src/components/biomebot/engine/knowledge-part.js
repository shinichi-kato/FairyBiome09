/*
  Knowledge Part
  =========================
  あらかじめ用意した辞書を使ってユーザのセリフに応答する。

  すべてのパートは同じ書式の辞書を用い、辞書にヒットしたかどうかの計算には
  共通のアルゴリズム(TF-IDFとfeature vectorによるcos類似度評価)を利用する。

*/

import { Message } from "@material-ui/icons";
import { randomInt } from "mathjs";

export function reply(state,work,message){
  // 返答生成
  

  return {}
}

export function render(message){
  // triggerやコマンドを展開して返す
  
  let reply = new Message();
  return reply
}