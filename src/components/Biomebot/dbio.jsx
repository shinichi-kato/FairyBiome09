import Dexie from "dexie";

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

export const initialize = (db) => {
  db.version(1).stores({
    config: "botId", // botId,description,...
    work: "botId", // id,
    main: "++id,[botId+key]",  // id,botId,key,val 
    parts: "[name+botId]", // name,config,cache
    scripts: "[botId+partName+id],partName,next,prev", // id,name,in,out,next,prev
    caches: "[botId+partName]", // scriptをコンパイルした結果を格納
  });
}

export const generate = async (db, obj, uid) => {
  /* 
    chatbot.jsonから読み込んだobjの内容をindexDBとstateに書き込む。
    チャットボットデータはobj.botIdが定義されているものと未定義のものがあり、
    obj.botIdが定義されているのはNPCチャットボット。
    未定義のものはユーザ用のチャットボットでbotIdにはuidを用いる。
    ユーザ用のチャットボットはユーザにつき同時に一つしか持てない。
   */

  const botId = obj.botId || uid;

  /* config */
  await db.config.put({
    ...obj.config,
    botId: botId,
    site: 'room',
    estimater: {}
  });

  /* work */
  await db.work.put({
    botId: botId,
    ...obj.work
  });

  /* main "id,[botId+key]" */
  await db.main
  .where('[botId+key]')
  .between([botId,Dexie.minKey], [botId,Dexie.maxKey])
  .delete();

  let dictKeys = Object.keys(obj.main);
  let mainData = [];
  for (let key of dictKeys) {
  let val = obj.main[key];

  if (typeof val === 'string') {
    mainData.push(
      { botId: botId, key: key, val: val }
    );
  }
  else if (Array.isArray(val)) {
    for (let v of val) {
      mainData.push(
        { botId: botId, key: key, val: v }
      )
    }
  }
  }

  await db.main.bulkAdd(mainData);

  /* 各partのデータのうちscript以外を記憶
     scriptは以下で別途記憶
  */
  dictKeys = Object.keys(obj.parts);

  await db.parts.bulkPut(
    dictKeys.map(key => {
      const part = obj.parts[key];
      return {
        name: key,
        botId: botId,
        config: {
          momentUpper: part.momentUpper,
          momentLower: part.momentLower,
          precision:   part.precision,
          retention: part.retention,
        },
        scriptTimestamp: part.scriptTimestamp,
        cacheTimestamp: part.cacheTimestamp,
      }
    }));

 

  /* scripts "[id+botId],partName,next,prev" */
  await db.scripts.where('[botId+partName+id]')
    .between(
      [botId, Dexie.minKey, Dexie.minKey],
      [botId, Dexie.maxKey, Dexie.maxKey])
    .delete();
    
  /* scriptはidをこちらで与え、next,prevも設定する */

  for (let partName of Object.keys(obj.parts)) {
    console.log("partName", partName)
    let data = [];
    const script = obj.parts[partName].script;
    let i;
    for (i in script) {
      data.push({
        id: i,
        botId: botId, // compound key
        partName: partName,
        in: script[i].in, out: script[i].out,
        next: i + 1,
        prev: i - 1,
      });
    }
    data[0] = { ...data[0], prev: null };
    data[i] = { ...data[i], next: null };
    await db.scripts.bulkAdd(data);
  }
}

export const load = async (db,botId) => {
  /* indexedDBからチャットボットのデータを読み込む。
    存在しなかった場合はnullを返す。
  */
  
  let config, work, displayName;
  config = await db.config.where({ botId: botId }).first();
  if (config) {
    work = await db.work.where({ botId: botId }).first();
    displayName = await db.main.where({ botId: botId, key: 'NAME' }).first();

    return {
      botId: botId,
      config: config,
      work: work,
      displayName: displayName,
      estimator: await readEstimator(db, botId)
    }
  }

  return null;
}

export const readScript = async (db,botId,partName) => {
  /* botId,partNameで指定されたscriptを読んで配列化して返す */

  return await db.scripts.where('[botId+partName+id]')
    .between(
      [botId, partName, Dexie.minKey],
      [botId, partName, Dexie.maxKey])
    .toArray();

}

export const saveCache = async (db,botId,partName,payload) => {
  /* payloadをcacheに書き込む */
  await db.cache.put({
    botId: botId,
    partName: partName,
    payload:payload
  });

}

export const loadCache = async (db,botId,partName) => {
  /* botId,partNameで指定されたcacheを読んで返す */
  return await db.cache
    .where({botId:botId,partName:partName})
    .first();
}

export const readEstimator = async (db,botId) => {
  /*  main辞書から入力文字列評価用の NEGATIVE_LABEL, POSITIVE_LABELを
      取得し、辞書を生成。 
      mainのスキームは id,[botId+key] なのでコンパウンドキー */

  let negatives = await db.main
    .where('[botId+key]').equals([botId,'NEGATIVE_LABEL'])
    .toArray();

  negatives = negatives.reduce((obj, data) => {

    obj[data.val] = true;
    return obj;
  }, {});

  let positives = await db.main
    .where('[botId+key]').equals([botId,'POSITIVE_LABEL'])
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