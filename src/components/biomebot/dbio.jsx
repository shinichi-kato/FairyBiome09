/*
  チャットボットデータI/O

  // config: チャットボットの基本設定
  config: { 
    botId: string,
    description: string,
    backgroundColor: string,
    circadian: {
      wake: 0-23, // 覚醒確率が50%になる時刻
      sleep: 0-23, // 睡眠確率が50%になる時刻
      delta: 1-, // wake/sleepから覚醒/睡眠確率が0/100になるまでの分数
    },
    initialMentalLevel: number,
    initialPartOrder: [],
  }

  // workはチャットボットの動作ごとに状態が変わる変数群で、
  // これを初期値としたsetStateで保持する
  work: {
    updatedAt: "",
    partOrder: [],
    mentalLevel: 100,
    moment: 0,
    mood: "peace",
    queue: [],
    futurePostings: []
  },
*/

import Dexie from "dexie";
import { reviver } from 'mathjs';

function toArray(data){
  return typeof data === 'string' ? [data] : data; 
}

class dbio {
  constructor() {
    this.db = new Dexie('Biomebot');
    this.db.version(1).stores({
      config: "botId", // botId,description,...
      work: "botId", // id,
      main: "++id,[botId+key]",  // id,botId,key,val 
      parts: "[botId+name]", // name,config,cache
      scripts: "[botId+partName+id],next,prev", // id,name,in,out,next,prev
      caches: "[botId+partName]", // scriptをコンパイルした結果を格納
    });

    this.generate = this.generate.bind(this);
    this.saveConfig = this.saveConfig.bind(this);
    this.saveMain = this.saveMain.bind(this);
    this.saveWork = this.saveWork.bind(this);
    this.savePart = this.savePart.bind(this);
    this.movePart = this.movePart.bind(this);
    this.updatePart = this.updatePart.bind(this);
    this.addPart = this.addPart.bind(this);
    this.load = this.load.bind(this);
    this.loadScript = this.loadScript.bind(this);
    this.saveScript = this.saveScript.bind(this);
    this.saveCache = this.saveCache.bind(this);
    this.loadCache = this.loadCache.bind(this);
    this.readEstimator = this.readEstimator.bind(this);
  }

  //-----------------------------------------------------------------------
  //
  //
  //  DBへの書き込み関数
  //
  //
  //-----------------------------------------------------------------------

  async generate(obj, uid) {

    /* 
      objの内容をindexDBとstateに書き込む。
      
      ユーザはfirestoreにあるチャットボットのデータをロードするか、chatbot.jonを
      読んでチャットボットを新規作成できる。chatbot.jsonからロードしたデータの
      うち、NPCチャットボットに限り@systemで終わるbotIddが付与されており、
      generate()時にbotIdが未定義の場合には uid と同じ値が与えられる。
      これによりローカルには任意の数のNPCチャットボットと最大一つのユーザ用
      チャットボットが記憶できる。

      なお、firestoreに一度保存されたデータにはfsBotIdが付与されるが、botIdとは
      独立に管理される。
      */

    const botId = obj.botId || uid;

    console.log("generate")
    /* config */
    await this.db.config.put({
      ...obj.config,
      botId: botId,
      fsBotId: null,
      site: 'room',
      estimator: {}
    });

    /* work */
    await this.db.work.put({
      ...obj.work,
      botId: botId,
      site: "room",
      partOrder: [...obj.config.initialPartOrder],
    });
    /* main "id,[botId+key]" */
    await this.saveMain(botId, obj.main);

    /* 各partのデータのうちscript以外を記憶
       scriptは以下で別途記憶
    */
    await this.savePart(botId, obj.parts);
    /* scriptはidをこちらで与え、next,prevも設定する */

    for (let partName of Object.keys(obj.parts)) {
      const script = obj.parts[partName].script;
      await this.saveScript(botId, partName, script);
    }
  }


  async saveConfig(botId, config) {
    /* configの内容をdbに書き込む 
    
      "config": {
        "description": "妖精の育て方を教えるお姉さん妖精",
        "backgroundColor": "#EEEE44",
        "avatarPath": "/chatbot/???/"
        "circadian": {
            "wake": 6,
            "sleep": 21
        },
        "initialMentalLevel": 100,
        "initialPartOrder": [
            "greeting",
            "faq",
            "cheer",
            "peace"
        ],
        "hubBehavior": {
            "utilization": 0.8,
            "precision": 0.5,
            "retention": 0.4
        }
    },
    */

    await this.db.config.put({
      ...config,
      botId: botId,
      site: 'room',
    });

  }

  async saveMain(botId, dict) {
    /* main "id,[botId+key]" */
    await this.db.main
      .where('[botId+key]')
      .between([botId, Dexie.minKey], [botId, Dexie.maxKey])
      .delete();

    const data = dict2data(botId, dict)

    await this.db.main.bulkAdd(data);
  }

  async saveWork(botId, dict) {
    await this.db.work
      .where({ botId: botId })
      .delete();

    await this.db.work.put({
      ...dict,
      botId: botId,
    });
  }

  async savePart(botId, dict) {
    /* 各partのデータのうちscript以外を記憶
       scriptは別途記憶
    */
    let dictKeys = Object.keys(dict);

    await this.db.parts.bulkPut(
      dictKeys.map(key => {
        const part = dict[key];
        return {
          botId: botId,
          name: key,
          kind: part.kind,
          cacheTimestamp: part.cacheTimestamp,
          featureWeights: part.featureWeights,
          momentLower: part.momentLower,
          momentUpper: part.momentUpper,
          precision: part.precision,
          retention: part.retention,
          scriptTimestamp: part.scriptTimestamp,
        }
      }));

  }

  async movePart(botId, obj) {
    const { prevName, newName, data } = obj;
    // prevNameのデータを削除
    await this.db.parts.where({ botId: botId, name: prevName })
      .delete();
    // 変更したpartのみ書き込み
    await this.db.parts.put({
      botId: botId,
      name: newName,
      ...data
    });
    // 未実装：スクリプトの移動
  }

  async updatePart(botId, obj) {
    const { prevName, data } = obj;
    // prevNameのデータを上書き
    await this.db.parts.where({ botId: botId, name: prevName })
      .modify(...data);
  }

  async addPart(botId) {
    // パートの追加
    // ユニークな名前を生成
    const lastNew = await this.db.parts
      .where('name')
      .startswith('New')
      .sortBy('name')
      .last()
      .slice(4)

    const newName = `New ${Number(lastNew) + 1}`;


    await this.db.parts.put({
      botId: botId,
      name: newName,
      kind: "knowledge",
      initialMood: "peace",
      momentUpper: 15,
      momentLower: 0,
      precision: 0.3,
      retention: 0.2,
      scriptTimestamp: null,
      cacheTimestamp: null,
      featureWights: null,
    });

    // 追加したパート用にスクリプトが必要だが、
    // 空のスクリプトが作れないので編集時に先送り

  }

  async load(botId) {
    // indexedDBからチャットボットのデータを読み込む。
    //  存在しなかった場合はnullを返す。

    let config, work, partList, displayName;
    let parts = {};
    let main = {};

    config = await this.db.config.where({ botId: botId }).first();
    if (config) {
      work = await this.db.work.where({ botId: botId }).first();
      displayName = await this.db.main.where({ botId: botId, key: 'NAME' }).first();
      console.log("load:displayname", displayName, "config", config)
      partList = await this.db.parts.where('[botId+name]')
        .between([botId, Dexie.minKey], [botId, Dexie.maxKey])
        .toArray();

      for (let part of partList) {
        // nameとbotIdはpartsに書き込まない
        Object.defineProperty(part, 'name', { enumerable: false });
        Object.defineProperty(part, 'botId', { enumerable: false });

        parts[part.name] = { ...part }
      };

      await this.db.main
        .where('[botId+key]')
        .between([botId, Dexie.minKey], [botId, Dexie.maxKey])
        .each(item => {
          if (item.key in main){
            main[item.key].push(item.val);
          }else{
            main[item.key] = [item.val];
          }
        });


      return {
        botId: botId,
        config: config,
        work: work,
        parts: parts,
        main: main,
        displayName: displayName.val,
        estimator: await this.readEstimator(botId)
      }
    }

    return null;
  }

  async isExist(botId){
    const config = await this.db.config.where({ botId: botId }).first();
    if (config) {
      return true;
    }
    return false;
  }

  async loadScript(botId, partName) {
    /* 
      botId,partNameで指定されたscriptを読んで配列化して返す.
      ※未実装：next順でソート
    */

    return await this.db.scripts.where('[botId+partName+id]')
      .between(
        [botId, partName, Dexie.minKey],
        [botId, partName, Dexie.maxKey])
      .toArray();

  }

  async saveScript(botId, partName, script) {

    /* 効率が低いが毎回全消去後に新規作成 */
    /* 辞書が大規模になったら再考する */
    await this.db.scripts.where('[botId+partName+id]')
      .between(
        [botId, partName, Dexie.minKey],
        [botId, partName, Dexie.maxKey])
      .delete();

    let data = [];
    let i;
    for (i in script) {
      data.push({
        id: i,
        botId: botId, // compound key
        partName: partName,
        in: toArray(script[i].in), out: toArray(script[i].out),
        next: i + 1,
        prev: i - 1,
      });
    }

    data[0] = { ...data[0], prev: null };
    data[i] = { ...data[i], next: null };

    await this.db.scripts.bulkAdd(data);
  }

  async saveCache(botId, partName, payload) {
    /* payloadをcacheに書き込む */
    await this.db.caches.put({
      botId: botId,
      partName: partName,
      cache: {
        outScript: payload.outScript,
        vocab: payload.vocab,
        wv: JSON.stringify(payload.wv),
        idf: JSON.stringify(payload.idf),
        tfidf: JSON.stringify(payload.tfidf),
        index: payload.index,
        fv: payload.fv,
        tagDict: payload.tagDict
      }
    });

  }

  async loadCache(botId, partName) {
    // botId,partNameで指定されたcacheを読んで返す
    // matrixizeWorkerが動作中でcacheがない場合は
    // デフォルト値を返す
    const data = await this.db.caches
      .where({ botId: botId, partName: partName })
      .first();
    const cache = data.cache;
    if (cache) {
      return {
        outScript: cache.outScript,
        vocab: cache.vocab,
        wv: JSON.parse(cache.wv, reviver),
        idf: JSON.parse(cache.idf, reviver),
        tfidf: JSON.parse(cache.tfidf, reviver),
        index: cache.index,
        fv: cache.fv,
        tagDict: cache.tagDict
      }
    }
    return {
      outScript: [],
      vocab: [],
      wv: [],
      idf: null,
      tfidf: null,
      index: null,
      fv: null
    }
  }

  async readEstimator(botId) {
    /*  main辞書から入力文字列評価用の NEGATIVE_LABEL, POSITIVE_LABELを
        取得し、辞書を生成。 
        mainのスキームは id,[botId+key] なのでコンパウンドキー */
    let negatives = await this.db.main
      .where('[botId+key]').equals([botId, 'NEGATIVE_LABEL'])
      .toArray();

    negatives = negatives.reduce((obj, data) => {

      obj[data.val] = true;
      return obj;
    }, {});

    let positives = await this.db.main
      .where('[botId+key]').equals([botId, 'POSITIVE_LABEL'])
      .toArray();

    positives = positives.reduce((obj, data) => {
      obj[data.val] = true;
      return obj;
    }, {});

    return {
      negatives: negatives,
      positives: positives,
    }
  }
}


export const db = new dbio();

function dict2data(botId, dict) {
  let dictKeys = Object.keys(dict);
  let data = [];

  for (let key of dictKeys) {
    let val = dict[key];

    if (typeof val === 'string') {
      data.push(
        { botId: botId, key: key, val: val }
      );
    }
    else if (Array.isArray(val)) {
      for (let v of val) {
        data.push(
          { botId: botId, key: key, val: v }
        )
      }
    }
  }

  return data;
}

