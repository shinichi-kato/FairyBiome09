/*
  Knowledge Part
  =========================
  あらかじめ用意した辞書を使ってユーザのセリフに応答する。

  すべてのパートは同じ書式の辞書を用い、辞書にヒットしたかどうかの計算には
  共通のアルゴリズム(TF-IDFとfeature vectorによるcos類似度評価)を利用する。

*/

import { randomInt } from "mathjs";

export function execute(work){
  // 起動チェック
  // moment値+0~9のランダム値がmomentUpperとmomentLowerの
  // 間に入っていたらOK
  

  // 辞書を検索し、scoreが　precisionよりも高ければ採用
}