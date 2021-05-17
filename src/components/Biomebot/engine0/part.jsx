/**
 * part class
 * 
 */

import Dexie from "dexie";
import {reviver} from 'mathjs';
import Message from '../../message';
import * as semantic from './semantic';

 class Part{
   constructor(db, name, botId){
    /*
      dbからpartのデータを読み込む
    */

    this.partName = name;
    this.botId = botId;
    this.db = db;
    
    const config = await db.part.where({name:name,botId:botId}).first();

    this.kind = config.kind;
    this.momentUpper = config.momentUpper || 20;
    this.momentLower = config.momentLower || 0;
    this.precision = config.precision || 0.5;
    this.retention = config.retention || 0.5;
    this.scriptTimestamp= config.scritpTimestamp || null;
  }

  async deploy(){
    // scriptの内容をコンパイルして
    // 計算結果を保持

    const script = await this.db.scripts.where('[botId+partName+id]')
    .between(
      [botId,partName,Dexie.minKey],
      [botId,partName,Dexie.maxKey])
    .toArray();
  
    // inスクリプトとoutスクリプトに分離
    let inScript = [];
    this.outScript = [];
    
    for (let line of script) {
      inScript.push(line.in);
      outScript.push(line.out);
    }
    
    const worker = new Worker(new URL('./matrixize.js',import.meta.url));
    worker.postMessage({ script:inScript });
    worker.onmessage = ({data: cache}) => {
      this.vocab= cache.vocab;
      this.wv = JSON.parse(cache.wv);
      this.idf = JSON.parse(cache.idf);
      this.tfidf = JSON.parse(cache.tfidf);
      this.index = JSON.parse(cache.index);
      this.fv = JSON.parse(cache.fv);

   }
   return 'ok';
  }

  async 
}