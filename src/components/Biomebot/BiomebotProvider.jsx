import React, {
  useState, useContext,
  createContext, useEffect, useReducer
} from 'react';

import Dexie from "dexie";
import { textToInternalRepr, dictToInternalRepr } from "./internalRepr";
import { TinySegmenter } from "./tinysegmenter";
import { FirebaseContext } from "../Firebase/FirebaseProvider";
import { Message } from "../message";

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


export default function BiomebotProvider(props) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [work, setWork] = useState({ key: 0, work: defaultSettings.work });
  const fb = useContext(FirebaseContext);

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
            momentBand: {
              upper: part.momentBand.upper,
              lower: part.momentBand.lower,
            },
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

    /* scripts "[id+botId],partName,next,prev" */
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

  function deploy(site) {

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
