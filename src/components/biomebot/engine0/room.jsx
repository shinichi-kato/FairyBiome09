/* 
  room
  ==============================
  室内でのチャットボット

  室内ではチャットボットとユーザが１対１で会話を行う。
  
  1. 覚醒/睡眠サイクル
  deploy時、チャットボットの状態は覚醒確率により決まる。
  
  2. START_DECK
  startトリガを受け取ったらstart_deckからランダムに選んだ一つの動作を行う。



  3. パートの優先順位
  初期のパート順位はinitialPartOrderで定義される。
  またmood名と同じ名前のパートは常にパート順位は最上位になる。


  
*/

import Dexie from "dexie";
import {reviver} from 'mathjs';
import Message from '../../message';
import * as semantic from './semantic';

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
    
      // inスクリプトとoutスクリプトに分離

    const worker = new Worker(new URL('./matrixize.js',import.meta.url));
    worker.postMessage({ script:script });
    worker.onmessage = ({data: cache}) => {
      const vocab= cache.vocab;
      const wv = JSON.parse(cache.wv);
      const idf = JSON.parse(cache.idf);
      const tfidf = JSON.parse(cache.tfidf);
      const index = JSON.parse(cache.index);
      const fv = JSON.parse(cache.fv);

      // dexiejsへ書き込み。timestampを付与する
    }
    
    // partのdeployを実行

    switch(partName){
      case 'semantic':
        semantic.deploy();
        break;
      defalut: 
        throw new Error('invalid partName')
    }
  }
}

export async function reciever(state, work, message, callback){
  /* reciever 関数
    msg: msg.textを内部表現に変換した状態のmessage
    callback: async callback(message) 返答を送信するのに使用

    チャットボットの状態を維持する必要があるため、この関数は変更後のworkを返す
  */
  let reply = new Message('system', {
    text: `est=${msg.estimation}`,
    site: 'room',
  });

  // partOrder順に返答するか決める
  let partOrder = [...work.partOrder];
  for (let partName of partOrder){
    
  }

  // {NOT_FOUND}をpartOrder順で探す

  await callback(reply)

  return {work:wk}
}
