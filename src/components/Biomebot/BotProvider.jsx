/*
BiomebotProvider
チャットボットコンテキスト＆I/O
=============================

Biomebotの保存・読み込みのI/Oを提供する。
チャットボットにはユーザがオーナーになり自由に編集できるものと、システムが運用する
NPCがある。これらはチャットボットはjson形式で定義した雛形から生成され、indexedDB
上に格納された状態で実行される。

indexedDB上にはユーザのチャットボットやシステムのNPCチャットボットが格納され、
ユーザのチャットボットはidがuid、NPCチャットボットは指定された名前をidとする。
初期化時点ではthis.botIdはnullで、connect()でbotの読み込みに成功したら
読み込んだbotIdが反映される。

タイトルページで「はじめから」を選ぶと新しくチャットボットが生成され、その時点で
indexedDBは新しいチャットボットの内容に置き換えられる。もしindexedDB上に
前のチャットボットがある場合、そのボットは「妖精の世界に帰る」ことになる。
以前のチャットボットはfirestoreに保存されていて森で出会うことができれば話せる。
森の妖精をバディにする方法は別途検討する。

一方システムのチャットボットはfirestore上には保存されず、予め決められたid
'tutor'などが使われてindexedDBに格納される。システム上でのチャットボットの切り
替えはこのbotIdの切り替えで実現する。


## 返答の生成

ユーザの発話や環境の変化をチャットボットに与えるのにrecieve関数を用い、それを起点に
チャットボットの会話エンジンが実行される。チャットボットが返答を行うのには
引数として渡すcallbackを利用する。

await recieve(message,callback)

チャットボットの返答ロジックはsiteごとに異なっており、siteが変わった場合システムは
別のファイルでユーザが定義した deploy() 関数を呼び出す。
deploy()関数は内部で各パートのインスタンス生成や初期化処理を行い、
reciever関数を返す。このreciever関数は

awaiit xxxReciever(state, work, message, callback)

で表され、

*/

import React, {
  useState, useContext,
  createContext, useEffect, useReducer
} from 'react';

import Dexie from "dexie";

import { FirebaseContext } from "../Firebase/FirebaseProvider";

import { textToInternalRepr, dictToInternalRepr } from "./internalRepr";
import { TinySegmenter } from "./tinysegmenter";
import * as dev from "./engine/dev";

export const BotContext = createContext();

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
    }
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

// メモリ中のみで管理するデータ。キャッシュ含む
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
  const [reciever, setReciever] = useState();

  const fb = useContext(FirebaseContext);


  useEffect(() => {
    let isCancelled = false;

    if (!db) {
      db = new Dexie('Biomebot');
      db.version(1).stores({
        config: "botId", // botId,config
        work: "botId", // id,work
        main: "[id+botId],key",  // id,botId,key,val 
        parts: "[name+botId]", // name,config,cache
        scripts: "[botId+partName+id],partName,next,prev", // id,name,in,out,next,prev
      });
    }

    if (fb.firebase && fb.uid && !isCancelled) {

      load(fb.firestore, fb.uid, fb.uid)
        .then(snap => {
          if (snap) {
            dispatch({ type: 'connect', snap: snap })
            setWork(prev => ({ key: prev.key + 1, work: snap.work }));
            // setParts()
            props.toMainPage();

          }
        });
    }

    return () => { isCancelled = true };

  }, [db, fb.firebase, fb.uid])

  function deploy(site) {
    /*
      siteごとのreplierをセット
    */
    const reciever = dev.deploy();
    setReciever(() =>
      async (st, wk, msg) => reciever);
  }

  function recieve(message) {
    const nodes = segmenter.segment(message.text);
    message.text = textToInternalRepr(nodes);

    message.estimation = estimate(message.text);

    reciever(state, work, message, sendMessage)
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

  function sendMessage(message) {
    props.sendMessage(message)
    //学習用のログにも追記
  }

  return (
    <BotContext.Provider
      value={{
        displayName: state.displayName,
        deploy: deploy,
        recieve: recieve,
      }}
    >
      {props.children}
    </BotContext.Provider>
  )
}

/* ----------------------------------------------------------


  I/O関数


---------------------------------------------------------- */

async function load(db, botId, uid) {

  let config, state, displayName;
  config = await db.config.where({ botId: botId }).first();
  if (config) {
    state = await db.state.where({ botId: botId }).first();
    displayName = await db.main.where({ botId: botId, key: 'NAME' }).first();

    return {
      botId: botId,
      config: config,
      work: defaultSettings.work,
      displayName: displayName,
      estimator: await readestimator(db)
    }
  }

  return null;
}

async function readestimator(db) {
  /*  main辞書から入力文字列評価用の NEGATIVE_LABEL, POSITIVE_LABELを
      取得し、辞書を生成。 */

  let negatives = await db.main
    .where({ botId: this.botId, key: 'NEGATIVE_LABEL' })
    .toArray();

  negatives = negatives.reduce((obj, data) => {

    obj[data.val] = true;
    return obj;
  }, {});

  let positives = await db.main
    .where({ botId: this.botId, key: 'POSITIVE_LABEL' })
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
