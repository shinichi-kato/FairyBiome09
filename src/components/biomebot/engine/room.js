
/*
  室内でのチャットボットの応答

  1. 時刻により睡眠・覚醒の状態が変化
  ２．partOrderに従って

*/
import {randomInt} from "mathjs";
import {retrieve} from './retrieve';

export function execute(state, work, message, sendMessage){

  for(let partName of work.partOrder){
    const part = state.parts[partName];

    // 起動チェック
    // moment値+0~9のランダム値がmomentUpperとmomentLowerの
    // 間に入っていたらOK

    const moment = work.moment+randomInt(9);
    if(part.momentLower >= moment || moment > part.momentUpper ){
      continue;
    }

    // 辞書の一致チェック

    const  = retrieve(message, state.cache[partName]);
  }

}
