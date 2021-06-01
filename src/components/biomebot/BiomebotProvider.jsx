/*
  Biomebot
  ===============

  複数の「心のパート」が競争的に動作して会話を生成するチャットボット

  ## 「心のパート」
  人の心には好奇心、共感、承認欲求、持っている知識を話したい、親密になりたい、
  労り、怒り、上機嫌、意気消沈、眠い状態、など様々なパートが共存している。
  これらのパートを表現するためにそれぞれに対して辞書を用意するが、これらに
  利用する返答アルゴリズムは以下の数種類にまとめることができる。
  
  パートの種類
  --------------------------------------------------------------
  episode   ユーザやチャットボット自身の発言を記憶し、評価が低くないものを
            自動で辞書化する。この方法で作った辞書で返答する。
  
  curiosity 辞書にない言葉をユーザが発言した場合、その言葉が何かを聞いて
            返答を辞書に追加する。
  
  knowledge あらかじめ用意した辞書を使ってユーザのセリフに応答する。
  --------------------------------------------------------------

  ## パートリストの動作機序
  チャットボットはメッセージを受け取るとpartOrder配列に格納された順番に
  別途part.jsxで説明する方法により評価を行う。成功したら返答が生成され、返答を
  行ったパートをpartOrder先頭または末尾に移動してパート評価から抜ける。
  失敗したら順次次のパートの評価を試みる。
  
  パート評価がすべて失敗だった場合はpartOrder配列に格納された順番に辞書の
  NOT_FOUND出力を試みる。
  
  最後にチャットボットのmoodと同名のパートが存在する場合はそれをpartOrderの
  先頭に移動する。
  

  ## 状態
  チャットボットには以下の状態(mood)があり、それぞれ対応するアバターを
  表示してユーザに状態を通知する。状態間の遷移は発言文字列中の{ENTER_PEACE}
  などで生じ、これによりmoodがpeaceに変化し、peaceという名前のパートがあれば
  それがpartOrder先頭に移動するとともに{ENTER_PEACE}をトリガ値とする
  messageがチャットボットのキューに乗ってpart評価が最初から再実行される。
  辞書の中に{ENTER_PEACE}トリガに対応する記憶を与えておくことで状態が
  変わったことで生じる自発的な応答を生成できる。

  チャットボットの状態
  -----------------------------
  peace    平常
  cheer    盛り上がっている
  down     落ち込んでいる
  wake     起床した
  sleepy   眠い
  sleep    睡眠中
  absent   不在
  -----------------------------

  ### チャットボットの覚醒/睡眠
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
  覚醒中は10分おきに覚醒チェックを行い、失敗すると{ENTER_SLEEPY}がトリガされる。
  SLEEPYでは発言ごとに覚醒チェックが行われ、失敗すると{ENTER_SLEEP}がトリガされる。
  
  deploy時にsleep状態であればユーザ発言を受け取るごとに覚醒チェックを行い、
  成功したら{ENTER_WAKE}がトリガされる。

  ## トリガ
  すでに一部説明しているが、トリガとはmessageクラスをtriggerモードで作成する
  ことで得られる。これをチャットボットに渡すとこのメッセージがキューの先頭に乗り、
  partOrderにしたがって評価される。トリガにはmoodの変化に対応する{ENTER_PEACE}
  などや入室{ENTER_ROOM}など、天候の変化{ENTER_晴}、{EXIT_雨}などがある。


  # 辞書の検索
  ユーザ、チャットボット、システム間の情報はすべてMessage型インスタンスを介して
  行っており、Messageにはテキスト、タイムスタンプ、ユーザ名の他に様々なfeatureが
  格納されている。
  テキスト部分は正規化したtfidfにより0~1の類似度が計算され、その他のfeatureはone-hot
  ベクターであり、ユーザ入力のfeatureとの内積が計算される。
  得られたスコアscoreはscore[0]がテキストの類似度、score[1...]がfeatureの内積である。
  すべて0~1の値が格納されている。これに対して重みWeightsを乗じて合計したものを
  全体のスコアとし、値は0〜1の範囲になるものとする。

  weightsのデフォルト値は、テキストがその他特徴量(6種)の2倍の重みを持つようにする。そのため
  text = 2/8
  person,mood,site,weather,season,daypart = 1/8
  という初期値を与える。
  

  ## [将来]機械学習
  weightsの値は機械学習により最適化が可能である。
  
  


*/

import React, {
  useContext,
  createContext,
  useEffect,
  useReducer,
  useState
} from 'react';
import {
  ones,
} from "mathjs";
import { FirebaseContext } from "../Firebase/FirebaseProvider";
import { Message, featureIndex } from '../message';

import { db } from './dbio';
import matrixizeWorker from "./engine/matrixize.worker";
import * as room from "./engine/room";

export const BiomebotContext = createContext();

let workers = {};
let execute = {
  'room': room.execute,
  'default': async (st, wk, msg, emitter) => {
    /* postMessageToBot 関数
      st: state
      wk: work
      msg: Message型データ
      sendMessage: ({message}) => {}
        チャットボットからのメッセージを発信するcallback関数

      初期状態はecho
    */
    const replyMessage = new Message('system', {
      text: `est=${msg.estimation}`,
      site: 'room',
    });

    // setWork

    await emitter(replyMessage)
  }
};



// チャットボットデータの初期値
const defaultSettings = {
  botId: null,
  config: {
    description: "",
    backgroundColor: "#eeeeee",
    estimatorLengthFactor: 0.6,
    avatarPath: "",
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
  },
  main: {
    "NAME": "uninitialized",
    "CREATOR_NAME": "uninitialized",
    "POSITIVE_LABEL": [],
    "NEGATIVE_LABEL": [],
    "START_DECK": "",
    "END_DECK": "",
  },
  work: {
    updatedAt: "",
    partOrder: [],
    mentalLevel: 100,
    moment: 0,
    mood: "peace",
    queue: [], // 複数にわけた出力を保持
    futurePostings: [], // 
  },
  part: {
    "untitledPart": {
      kind: "knowledge",
      momentUpper: 5,
      momentLower: 0,
      precision: 0.6,
      retention: 0.2,
      scriptTimestamp: null,
      cacheTimestamp: null,
      featureWeights: null,
      script: []
    }
  }
}

// 更新頻度が低いデータ
const initialState = {
  botId: null,
  displayName: "",
  config: {},
  parts: {},
  cache: {},
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

      // featureWeightsがなければ
      // featureWeights=[0.2,0.2...],featureBiases=0で初期化
      for (let partName in snap.parts) {
        if (!snap.parts[partName].featureWeights) {
          let newWeights = ones(featureIndex.length) * (1 / 10);
          newWeights[1] = 4 / 10; // ※先頭は1番
          snap.parts[partName].featureWeights = newWeights;
        }
      }

      return {
        botId: snap.botId,
        displayName: snap.displayName,
        config: snap.config,
        main: snap.main,
        parts: snap.parts,
        estimator: snap.estimator
      }
    }

    case 'readCache': {
      const cache = action.cache;
      const partName = action.partName;
      return {
        ...state,
        cache: {
          ...state.cache,
          [partName]: cache
        }
      }
    }

    default:
      throw new Error(`invalid action ${action}`);
  }
}

export default function BiomebotProvider(props) {
  const fb = useContext(FirebaseContext);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [work, setWork] = useState({
    key: 0,
    ...defaultSettings.work
  });


  function handleExecute(message, emitter) {
    execute[work.site](state, work, message, emitter)
      .then(workSnap => {
        setWork(prev => ({
          prev,
          ...workSnap
        }));
      })
  }

  useEffect(() => {
    let isCancelled = false;

    if (!isCancelled) {
      if (props.appState === 'authOk' && fb.uid) {
        db.load(fb.uid)
          .then(snap => {
            if (snap) {
              dispatch({ type: 'connect', snap: snap })
              setWork(prev => ({ key: prev.key + 1, ...snap.work }));
              props.handleBotFound();
            }
            else {
              props.handleBotNotFound();
            }
          });
      }
    }

    return () => { isCancelled = true }
  }, [props.appState, fb.uid]);

  async function generate(obj, avatarPath) {
    // avatarPathをobjに組み込む
    obj.config.avatarPath = avatarPath;

    // indexDBへの書き込み
    await db.generate(obj, fb.uid);

    // stateへの書き込み
    dispatch({ type: 'connect', snap: obj });
    setWork(prev => (
      {
        key: prev.key + 1,
        work: {
          updatedAt: "",
          partOrder: obj.config.initialPartOrder,
          mentalLevel: obj.config.initialMentalLevel,
          moment: 0,
          mood: "peace",
          queue: [],
          futurePostings: []
        }
      }));
  }

  async function deploy(site, handleRecieveMessageFromBot) {

    for (let partName of state.config.initialPartOrder) {

      // 各パートのscriptを読んでcacheに変換
      // webWorkerが別スレッドで処理し、結果をstateに読み込む
      if (!(partName in workers)) {
        workers[partName] = new matrixizeWorker();
      }
      const worker = workers[partName];

      worker.onmessage = function (event) {
        const result = event.data;
        if (result) {
          db.loadCache(state.botId, result.partName)
            .then(cache => {
              dispatch({
                type: 'readCache',
                partName: result.partName,
                cache: cache
              });
            })
        }
      };

      worker.postMessage({ botId: state.botId, partName });

    }
  }

  const photoURL = `/chatbot/${state.config.avatarPath}/${work.mood}.svg`;

  return (
    <BiomebotContext.Provider
      value={{
        execute: handleExecute,
        generate: generate,
        deploy: deploy,
        state: state,
        photoURL: photoURL,
      }}
    >
      {props.children}
    </BiomebotContext.Provider>
  );
}