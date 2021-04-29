/* 
  room
  ==============================
  室内でのチャットボット

  室内ではチャットボットとユーザが１対１で会話を行う。
  
  1. 覚醒/睡眠サイクル
  deploy時、チャットボットの状態は覚醒確率により決まる。
  覚醒チェックに成功した場合peace状態でスタートし、startトリガがセットされる。
  実行中は5分ごとに覚醒チェックを行い、失敗したらsleepyトリガがセットされる。
  sleepy状態で覚醒チェックにしいっぱいしたらsleepトリガがセットされる。
  deploy時に覚醒チェックに失敗したらsleep状態でスタートする。
  実行中はユーザから声をかけられるたびに覚醒チェックを行い、
  成功したらwakeupトリガがセットされる。

  2. START_DECK
  startトリガを受け取ったらstart_deckからランダムに選んだ一つの動作を行う。

  3. パートの優先順位
  初期のパート順位はinitialPartOrderで定義される。
  またmood名と同じ名前のパートは常にパート順位は最上位になる。


  
*/

import Dexie from "dexie";
import { matrixize } from './matrixize';

export async function deploy(parts,db,botId){
  /* 
    db.parts, db.config
    ・各パートにスクリプトのコンパイルを実行させ計算結果をdbに保存
    ・recieverの設定
    ・チャットボットのstateを初期化して返す
  */
  for(let partName in parts){
    const part = parts[partName];
    const script = await db.scripts.where('[botId+partName+id]')
      .between(
        [botId,partName,Dexie.minKey],
        [botId,partName,Dexie.maxKey])
      .toArray();
    const result = matrixize(script);
    
  }
}

export async function reciever(st, wk, msg, callback){
  /* reciever 関数
    st: state
    wk: work
    msg: msg.textを内部表現に変換した状態のmessage
    callback: async callback(message) 返答を送信するのに使用

    チャットボットの状態を維持する必要があるため、この関数は変更後のworkを返す
  */
  const reply = new Message('system', {
    text: `est=${msg.estimation}`,
    site: 'room',
  });

  await callback(reply)

  return {work:wk}
}
