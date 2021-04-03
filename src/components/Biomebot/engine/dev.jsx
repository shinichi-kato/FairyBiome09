/* 開発用チャットボットの会話エンジン 

このパッケージでは
deploy(site)
reciever(state, work, message, callback)
xxx.repliier(state, work, message, callback)
を定義する。

deploy(site)はチャットルームに入ったときに呼ばれ、
部屋に合わせてチャットボットのrecieverを切り替える。
reciever(state, work, message, callback)はチャットボットが
システムからの入力を受け取る関数で、入力にはユーザのセリフや環境の変化がある。
またチャットボットの内部状態はシステム側で state hook を使って管理するため
本パッケージで内部状態は記憶しない。会話エンジンで必要になる
すべての内部状態はstateおよびworkとして与えられる。

reciever関数はその内部で各パートの会話モジュールを実行する。
それがxxx.replier関数である

*/

import {Message} from "../message";


export async function reciever(state,work,message,callback){
  /* 開発用
  */
  const nodes = message.text.join(",");
  let newMessage = new Message('system',`est=${message.estimation} ${nodes}`);

  callback(newMessage);

  return {
    ...work
  } 
}

export function deploy(site){
  // ここでpartの初期化
  return reciever;
}
