/*
BiomeBotBase
チャットボット ベースクラス
============================

チャットボットのデータはindexedDBおよびfirestoreに格納される。
チャットボットにはユーザがオーナーになり自由に編集できるものと、システムが運用する
NPCがある。これらはチャットボットはjson形式で定義した雛形から生成され、indexedDB
上に格納された状態で実行される。

indexedDB上にはユーザのチャットボットやシステムのNPCチャットボットが格納され、
ユーザのチャットボットはidがuid、NPCチャットボットは指定された名前をidとする。
初期化時点ではthis.botIdはnullで、connect()でbotの読み込みに成功したら
読み込んだbotIdが反映される。読み込むべきデータが見つからない場合は "" になる。

タイトルページで「はじめから」を選ぶと新しくチャットボットが生成され、その時点で
indexedDBは新しいチャットボットの内容に置き換えられる。もしindexedDB上に
前のチャットボットがある場合、そのボットは「妖精の世界に帰る」ことになる。
以前のチャットボットはfirestoreに保存されていて森で出会うことができれば話せる。
森の妖精をバディにする方法は別途検討する。

一方システムのチャットボットはfirestore上には保存されず、予め決められたid
'tutor'などが使われてindexedDBに格納される。システム上でのチャットボットの切り
替えはこのbotIdの切り替えで実現する。

indexedDBは以下の設計とする

    db.version(1).stores({
      config: "botId, uid", // botId,uid,config
      state: "botId", // id,state
      main: "++id, botId",  // id,botId,key,val 
      parts: "botId, &name", // name,config 
      scripts: "id,botId,part,next,prev", // id,part,in,out,next,prev
      cache: "botId, partName", // botId, partName,vector,wv, tfidf, ...
    });   

チャットボットの名前はmain['NAME']に格納されており、
それをindexedDB読み込み時にthis.displayNameCacheに代入している。

firestore上でのデータの構造：ユーザのチャットボットのみ格納される
firestore.collection("Biomebot")
  .doc(docId)
    uid,
    updated,
    config: { ... },
    state: { ... }
    .collection("main")
        key,
        val
    .collection("scripts")
        in
        out
})


*/

import Dexie from "dexie";

var undefined;
let db = null;

const initialState = {
  
  state: {
    updatedAt: "",
    partOrder: [],
    mentalLevel: 100,
    moment: 0,
    mood: "peace",
    queue: [],
    timerPostings: []
  }
};

export default class BiomebotBase {
  constructor() {

    if (!db && window !== undefined) {
      db = new Dexie('Biomebot');
      db.version(1).stores({
        config: "botId", // botId,config
        state: "botId", // id,state
        main: "[id+botId],key",  // id,botId,key,val 
        parts: "[name+botId]", // name,config 
        scripts: "[botId+partName+id],partName,next,prev", // id,name,in,out,next,prev
        cache: "botId, partName", // botId, partName,vector,wv, tfidf, ...
      });
    }

    this.firestore = null;
    this.uid = null;
    this.botId = null;
    this.estimater = {
      negatives: [],
      positives: []
    }
  }

  get state() {
    let s = null;
    if (this.botId){
      (async () => {
        s = await db.state.where({botId:this.botId}).first();
      })();
    }

    return  s || initialState;
  }

  async connect(firestore, botId, uid) {
    /* 
      indexedDB上にデータあればそれを読む
    */
    this.firestore = firestore;
    this.uid = uid;
    let config, state, dispName;

    config = await db.config.where({ botId: botId }).first();
    if (config) {
      state = await db.state.where({ botId: botId }).first();
      dispName = await db.main.where({ botId: botId, key: 'NAME' }).first();

      this.botId = botId;
      this.config = config;
      this.state = state;
      this.displayNameCache = dispName;

      return {
        botId: botId,
        config: config,
        state: state,
        displayName: dispName
      }
    }

    return {
      botId: "",
    }
  }

  async generate(obj, dir) {
    /*
      objを読み込んでindexedDBに書き込む。
      botIdを省略した場合はthis.uidを用いる
      NPCボットはobj内でbotIdを定義しており、それを優先する。
    */

    if (obj.botId === undefined && this.uid === null) {
      throw new Error('biomebot.generate(): no botId supplied')
    }
    console.log("uid=", this.uid)

    let config, state;
    this.botId = obj.botId || this.uid;
    let data = obj.config;
    config = {
      botDir: dir,
      description: data.description,
      initialMentalLevel: data.initialMentalLevel,
      startPartOrder: [...data.startPartOrder],
      hubBehavior: {
        momentBand: {
          upper: data.hubBehavior.momentBand.upper,
          lower: data.hubBehavior.momentBand.lower,
        }
      },
      precision: data.precision,
      retention: data.retention,
    };
    state = { ...obj.state };

    /* config */
    await db.config.put({
      botId: this.botId,
      config: config
    });

    /* state */
    await db.state.put({ botId: this.botId, state: obj.state });

    /* main "[id+botId],key" */
    await db.main
      .where('[id+botId]')
      .between([Dexie.minKey, this.botId], [Dexie.maxKey, this.botId])
      .delete();

    let dictKeys = Object.keys(obj.main);
    let mainData = [];
    let i = 0;
    for(let key of dictKeys){
      let val = obj.main[key];

      if(typeof val === 'string'){
        mainData.push(
          { id: ++i, botId: this.botId, key: key, val: val }
        );
      }
      else if(Array.isArray(val)){
        for (let v of val){
          mainData.push(
            { id: ++i, botId: this.botId, key: key, val: v }
          )
        }
      }
    }
    await db.main.bulkAdd(mainData);


    /* parts "[name+botId]", // name,config */
    dictKeys = Object.keys(obj.parts);

    await db.parts.bulkPut(
      dictKeys.map(key => {
        const part = obj.parts[key];
        return {
          name: key,
          botId: this.botId,
          config: {
            momentBand: {
              upper: part.momentBand.upper,
              lower: part.momentBand.lower,
            },
            precision: part.precision,
            retention: part.retention,
          }
        }
      }));

    // let outed = await db.parts
    //   .where('name')
    //   .noneOf(dictKeys)
    //   .catch(e=>console.error(e));

    // if(await outed.count() >0){
    //   await outed.filter(item=>item.botId===this.botId).delete();
    // }

    /* scripts "[id+botId],partName,next,prev" */
    await db.scripts.where('[botId+partName+id]')
      .between(
        [this.botId, Dexie.minKey, Dexie.minKey],
        [this.botId, Dexie.maxKey, Dexie.maxKey])
      .delete();

    /* scriptはidをこちらで与え、next,prevも設定する */

    for (let partName of Object.keys(obj.parts)) {
      console.log("partName", partName)
      data = [];
      const script = obj.parts[partName].script;
      let i;
      for (i in script) {
        data.push({
          id: i,
          botId: this.botId, // compound key
          partName: partName,
          in: script[i].in, out: script[i].out,
          next: i + 1,
          prev: i - 1,
        });
      }
      data[0] = { ...data[0], prev: null };
      data[i] = { ...data[i], next: null };
      console.log("data:", data)
      await db.scripts.bulkAdd(data);
    }

    return {
      botId: this.botId,
      config: config,
      state: state,
      displayNameCache: obj.main['NAME']
    };
  }

  async rename(displayName) {
    await db.main
      .where({ botId: this.botId, key: 'NAME' })
      .modify({ val: displayName });

    this.displayNameCache = displayName;
  }

  async readEstimator() {
    /*  main辞書から入力文字列評価用の NEGATIVE_LABEL, POSITIVE_LABELを
        取得し、辞書を生成。 */

    let negatives = await db.main
      .where({ botId: this.botId, key: 'NEGATIVE_LABEL' })
      .toArray();

    negatives = negatives.reduce((obj,data)=>{
        
        obj[data.val] = true;
        return obj;
      }, {});
    
    let positives = await db.main
      .where({ botId: this.botId, key: 'POSITIVE_LABEL' })
      .toArray();

    positives = positives.reduce((obj, data)=>{
        obj[data.val] = true;
        return obj;
      }, {});

    this.estimater = {
      negatives: negatives,
      positives: positives,
    }
  }
}

