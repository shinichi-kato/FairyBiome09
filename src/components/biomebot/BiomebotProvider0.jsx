/*
  Biomebot
  ======================

  複数の「心のパート」が競争的に動作して会話を生成するチャットボット

  ## 「心のパート」
  人の心の中には立場や働きの異なる様々な「パート」が同時に存在し、それらが
  競争的に作動して発話を行っている。これをモデルとして、Biomebotも複数の
  返答モジュール「Part」を集めてチャットボット全体を構成する。

  パートのタイプ
  ----------------------------------------------------------
  episode     ユーザやチャットボットの発言を記憶し、評価の高いものを
              自動で辞書化する。この方法で作った辞書で返答する。       
  curiousity  辞書にない言葉をユーザが発言した場合、その言葉が何かを聞いて
              その返答を辞書に追加する。
  semantic    あらかじめ用意した知識辞書を使ってユーザのセリフに応答する。    

  ## チャットボットの状態

  チャットボットには
  
  'peace'|'cheer'|'down'|'absent'|'wake'|'sleepy'|'sleep'

  という状態があり、それぞれに対応するアバター画像によりそれをユーザに表現する。
  peaceは平常状態で、cheer/downは元気な状態、落ち込んだ状態である。
  absentは不在でチャットボットは応答しない。sleepyは眠くなった状態でasleepは
  睡眠中を示す。状態と同名のパートが存在した場合、そのパートはパート順が常に先頭になる。
  パートの中ではコマンド{SETMOOD_PEACE}などにより他の状態に遷移することができる。
  
  睡眠/覚醒は
  circadian:{
    wake: number(24hour),
    sleep: number(24hour),
    delta: number(min)
  }
  で定義し、下記のような台形の覚醒確率を持つ。

    　        -delta wake +delta     -delta sleep +delta
  --------------------------------------------------------
  覚醒状態確率    0%   50%  100%        100%   50%    0%
  
  deploy時に覚醒チェックを行い、覚醒/睡眠の状態を決める。
  このときwake状態であれば{WAKEUP}がトリガされる。
  覚醒中は10分おきに覚醒チェックを行い、失敗すると{SLEEPY}がトリガされる。
  SLEEPYでは発言ごとに覚醒チェックが行われ、失敗すると{ASLEEP}がトリガされる。
  
  deploy時にsleep状態であればユーザ発言を受け取るごとに覚醒チェックを行い、
  成功したら{WAKEUP}がトリガされる。
  
  ## 返答生成

  チャットボットはユーザの入力に対して何も返答できなかった場合、main辞書の{NOT_FOUND}
  を使用して相槌などの反応を行う。ここでパートにも{NOT_FOUND}がある場合はpartOrderに従って
  {NOT_FOUND}を探し、最初に見つかったものを利用して返答する。

*/

import React, {
  useState, useContext,
  createContext, useEffect, useReducer
} from 'react';

import Dexie from "dexie";
import { textToInternalRepr, dictToInternalRepr } from "./internalRepr";
import { TinySegmenter } from "./tinysegmenter";
import { FirebaseContext } from "../Firebase/FirebaseProvider";
import { Message } from "../message";
import useInterval from '../use-interval';
import checkWake from './circadian';
import * as room from "./engine/room";

export const BiomebotContext = createContext();
const segmenter = new TinySegmenter();


// estimate()でポジティブ・ネガティブな単語がなかった場合、
// len(nodes) ^ ESTIMATOR_LEENGTH_FACTORをスコアとする 
const ESTIMATOR_LENGTH_FACTOR = 0.6;

let db = null;

// indexedDBに保持されるチャットボットのデータ
const defaultSettings = {
  botId: null,
  config: {
    description: "",
    backgroundColor: "#eeeeee",
    circadian: {
      wake: 6,
      sleep: 21,
      delta: 60,
    },
    initialMentalLevel: 10,
    initialPartOrder: [],
    hubBehavior: {
      momentUpper: 10,
      momentLower: 0,
      precision: 1,
      retention: 0
    },
    dir: "", // dirはjsonファイルのパスで、fetchしたjsonファイル内には記述しない
  },
  main: {
    "NAME": "uninitialized",
    "CREATOR_NAME": "uninitialized",
    "POSITIVE_LABEL": [],
    "NEGATIVE_LABEL": [],
    "START_DECK": "",
    "END_DECK": "",
  },
  parts: [],
  // workはチャットボットの動作ごとに状態が変わる変数群で、
  // これを初期値としたsetStateで管理する
  work: {
    updatedAt: "",
    partOrder: [],
    mentalLevel: 100,
    moment: 0,
    mood: "peace",
    queue: [],
    futurePostings: []
  },
};

// state: メモリ中のみで管理するデータ。キャッシュ含む
const initialState = {
  botId: null,
  site: "room",
  displayName: null,
  config: defaultSettings.config,
  parts: defaultSettings.parts,
  estimator: {
    positive: [],
    negative: [],
  }
};


function reducer(state, action) {
  switch (action.type) {
    case 'init': {
      return initialState;
    }

    case 'connect': {
      const snap = action.snap;
      return {
        botId: snap.botId,
        site: "room",
        displayName: snap.displayName,
        config: snap.config,
        parts: snap.parts,
        estimator: snap.estimator
      }
    }

    default:
      throw new Error(`invalid action ${action}`);
  }
}

/*------------------------------------------------------------------






--------------------------------------------------------------------*/

export default function BiomebotProvider(props) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [work, setWork] = useState({ key: 0, work: defaultSettings.work });
  const fb = useContext(FirebaseContext);
  /*
    props.
  */

  const [reciever, setReciever] = useState(
    () => async (st, wk, msg, callback) => {
      /* reciever モック関数 
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
  );

  const appState = props.appState;
  useEffect(() => {
    let isCancelled = false;

    if (!db && !isCancelled) {
      db = new Dexie('Biomebot');
      db.version(1).stores({
        config: "botId", // botId,config
        work: "botId", // id,work
        main: "++id,[botId+key]",  // id,botId,key,val 
        parts: "[name+botId]", // name,config,cache
        scripts: "[botId+partName+id],partName,next,prev", // id,name,in,out,next,prev
      });
    }

    if (appState === 'authOk' && fb.uid && !isCancelled) {

      loadDB(db, fb.uid)
        .then(snap => {
          if (snap) {
            dispatch({ type: 'connect', snap: snap })
            setWork(prev => ({ key: prev.key + 1, work: snap.work }));
            // setParts()

            props.handleBotFound();

          } else {

            props.handleBotNotFound();
          }

        });
    }

  }, [appState, db, fb.uid]);

  async function generate(obj, dir) {
    /* 
      objの内容をindexDBとstateに書き込む。
      チャットボットデータはobj.botIdが定義されているものと未定義のものがあり、
      obj.botIdが定義されているのはNPCチャットボット。
      未定義のものはユーザ用のチャットボットでbotIdにはfb.uidを用いる。
      ユーザ用のチャットボットはユーザにつき同時に一つしか持てない。
    */

    const snap = {
      botId: obj.botId || fb.uid,
      site: 'room',
      config: {
        ...obj.config,
        dir: dir,
      },

      estimator: {}, // estimatorはdeploy時に生成
    };

    /* config */
    await db.config.put({
      botId: snap.botId,
      config: snap.config
    });

    /* work */
    await db.work.put({
      botId: snap.botId,
      work: snap.work,
    });

    /* parts "[name+botId]", // name,config */
    let dictKeys = Object.keys(obj.parts);

    await db.parts.bulkPut(
      dictKeys.map(key => {
        const part = obj.parts[key];
        return {
          name: key,
          botId: snap.botId,
          config: {
            momentUpper: part.momentUpper,
            momentLower: part.momentLower,
            precision: part.precision,
            retention: part.retention,
          }
        }
      }));
    /* main "id,[botId+key]" */
    await db.main
      .where('[botId+key]')
      .between([snap.botId,Dexie.minKey], [snap.botId,Dexie.maxKey])
      .delete();

    dictKeys = Object.keys(obj.main);
    let mainData = [];
    for (let key of dictKeys) {
      let val = obj.main[key];

      if (typeof val === 'string') {
        mainData.push(
          { botId: snap.botId, key: key, val: val }
        );
      }
      else if (Array.isArray(val)) {
        for (let v of val) {
          mainData.push(
            { botId: snap.botId, key: key, val: v }
          )
        }
      }
    }
    await db.main.bulkAdd(mainData);

    /* scripts "[botId+partName+id],in,out,next,prev" */
    await db.scripts.where('[botId+partName+id]')
      .between(
        [snap.botId, Dexie.minKey, Dexie.minKey],
        [snap.botId, Dexie.maxKey, Dexie.maxKey])
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
          botId: snap.botId, // compound key
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

    setWork({
      updatedAt: "",
      partOrder: obj.config.initialPartOrder,
      mentalLevel: obj.config.initialMentalLevel,
      moment: 0,
      mood: "peace",
      queue: [],
      futurePostings: []
    });

    dispatch({type: 'connect', snap:snap});

  }

  function deploy(site,callback) {
    /* 
      チャットボットの起動
    */

    switch(site) {
      case 'room':
        room.deploy(state.parts,db);

        setReciever( () => async (st, wk, msg, callback) => {
          /* reciever モック関数 
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
        });
      
    }

    /*// 覚醒・睡眠サイクルの起動
    const isWake = checkWake(state.config.circadian);
    if(isWake){
      // 覚醒状態だったら{WAKEUP}をトリガ
      const msg = new Message('trigger',{trigger:"{WAKEUP}"})
      reciever(state, work, msg, props.writeLog)
      .then(snap => {
        setWork(prev => ({ key: prev.key + 1, work: snap.work }));
      });
      // 以降10分ごとに覚醒チェック
      // 失敗したらsleepyに移行
      useInterval(()=>{
        const isWake = checkWake(state.config.circadian);
        if(!isWake){
          const msg = new Message('trigger',{trigger:"{SLEEPY}"});
          reciever(state, work, msg, props.writeLog)
          .then(snap => {
            setWork(prev => ({ key: prev.key + 1, work: snap.work }));
          });
        }
      },10*60*1000)
    }*/
  }

  function recieve(message) {
    const nodes = segmenter.segment(message.text);
    message.text = textToInternalRepr(nodes);

    message.estimation = estimate(message.text);

    reciever(state, work, message, props.writeLog)
      .then(snap => {
        setWork(prev => ({ key: prev.key + 1, work: snap.work }));
      });
  }

  function estimate(text) {
    /* 内部表現化されたテキストに含まれるネガティブ/ポジティブワードを
      見つけてスコアを与える。
      テキストに含まれたポジティブなワードを優先して評価し、
      ポジティブなワードが見つからない場合ネガティブなワードの数を評価する。
      どちらも含まない場合は長い文字列ほどポジティブとし、文字列の長さをlと
      したとき、以下の式で与えられる。

      score = text.length^ESTIMATOR_LENGTH_FACTOR
      */
    let score = 0;
    const pos = state.estimator.positives;
    const neg = state.estimator.negatives;

    score = text.reduce((score, word) => (score + word in pos ? 1 : 0), 0);
    if (score !== 0) return score;

    score = text.reduce((score, word) => (score + word in neg ? -1 : 0), 0);
    if (score !== 0) return score;

    return Math.round(text.length ^ ESTIMATOR_LENGTH_FACTOR);
  }


  return (
    <BiomebotContext.Provider
      value={{
        recieve: recieve,
        generate: generate,
        deploy: deploy,
        state: state,
      }}
    >
      {props.children}
    </BiomebotContext.Provider>
  )
}

/* ----------------------------------------------------------


  I/O関数


---------------------------------------------------------- */

async function loadDB(db, botId) {

  let config, work, displayName;
  config = await db.config.where({ botId: botId }).first();
  if (config) {
    work = await db.work.where({ botId: botId }).first();
    displayName = await db.main.where({ botId: botId, key: 'NAME' }).first();

    return {
      botId: botId,
      config: config,
      work: work || defaultSettings.work,
      displayName: displayName,
      estimator: await readEstimator(db, botId)
    }
  }

  return null;
}

async function readEstimator(db,botId) {
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