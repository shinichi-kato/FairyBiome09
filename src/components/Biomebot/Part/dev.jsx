/* 開発用チャットボットの会話エンジン 

返答


*/

import {Message} from "../message";


export async function devReciever(state,work,message,callback){
  /* 開発用
  */
  let newWork={};
  let newMessage = new Message();

  send(newMessage);

  return {
    ...work
  } 
}

export function deploy(site){
  // ここでpartの初期化
  return devReciever;
}
