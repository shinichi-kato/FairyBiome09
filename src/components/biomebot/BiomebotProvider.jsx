/*
  Biomebot
  ===============

  複数の「心のパート」が競争的に動作して会話を生成するチャットボット

  ## 「心のパート」
  人の心には好奇心、共感、承認欲求、持っている知識を話したい、親密になりたい、
  労り、怒り、上機嫌、意気消沈、眠い状態、など様々なパートが共存している。
  それらは並列的・競争的に動作しており、その中の一つが優勢になって返答を生成して
  いると考えられる。
  Biomebotはこれらパートごとに単独でも動作しうるチャットボットを生成し、それらの
  相互作用を通して一つの統合されたキャラクタを表現することを試みる。ここで各パートは
  別個の働きを持っているが、そこで用いる返答アルゴリズムは以下の数種類にまとめることが
  できる。
  
  パートの種類
  --------------------------------------------------------------
  episode   ユーザやチャットボット自身の発言を記憶し、評価が低くないものを
            自動で辞書化する。この方法で作った辞書で返答する。
  
  curiosity 辞書にない言葉をユーザが発言した場合、その言葉が何かを聞いて
            返答を辞書に追加する。
  
  knowledge あらかじめ用意した辞書を使ってユーザのセリフに応答する。
  --------------------------------------------------------------

  ## 「心の状態」
  チャットボットには下記の「心の状態」があり、時刻や体調など会話の流れ以外の
  要因によっても変化する

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



  ## パートリストの動作機序
  チャットボット起動時はwork.partOrderはstate.initialPartOrderをコピーした
  内容になり、その先頭にあるpartの{enter_パート名}が自動的に実行される。

  チャットボットはメッセージを受け取るとwork.partOrderに格納された順番に
  別途part.jsxで説明する方法により評価を行う。成功したら返答が生成され、返答を
  行ったパートをpartOrder先頭または末尾に移動してパート評価から抜ける。
  失敗したら順次次のパートの評価を試みる。
  
  パート評価がすべて失敗だった場合はpartOrder配列に格納された順番に辞書の
  NOT_FOUND出力を試みる。
  

  ## パートで表現するもの
  
  各パートはそれぞれ対応するアバターを表示してユーザに状態を通知する。
  パート間の遷移は発言文字列中の{enter_peace}などで生じ、peaceという名前の
  パートがpartOrder先頭に移動するとともに{enter_peace}をトリガ値とする
  messageがチャットボットのキューに乗ってpart評価が最初から再実行される。
  辞書の中に{enter_peace}トリガに対応する記憶を与えておくことで状態が
  変わったことで生じる自発的な応答を生成できる。
  
  ### 状態パート

  パートの相互作用や外的な要因により、チャットボットの「心の状態」が変化する場合がある。
  心の状態にはそれらに固有のパートが別個に記述される。下記の状態と同名のパートが
  トリガされた場合は自動的にmoodの値が状態名で上書きされる。

  チャットボットの状態パート
  -----------------------------
  peace    平常
  cheer    盛り上がっている
  down     落ち込んでいる
  wake     起床した
  sleepy   眠い
  sleep    睡眠中
  absent   不在
  -----------------------------

  ### 行動パート

  挨拶、問い合わせへの返答、思い出し話など、特定の話題に従った行動はそれぞれ
  別のパートとして記述する。これらの行動パートにも「心の状態」が定義される。
  行動パート{enter_greeting}などによりトリガされる。
  またパートの設定の中にinitialMoodがあり、チャットボットのmoodはその値で
  上書きされる。initialMoodが定義されていない場合はpeaceになる。


  ## トリガ
  すでに一部説明しているが、トリガとはmessageクラスをtriggerモードで作成する
  ことで得られる。これをチャットボットに渡すとこのメッセージがキューの先頭に乗り、
  partOrderにしたがって評価される。トリガにはmoodの変化に対応する{enter_peace}
  などや入室{enter_room}など、天候の変化{enter_晴}、{enter_雨}などがある。


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
  person,part,site,weather,season,daypart = 1/8
  という初期値を与える。
  

  ## [将来]機械学習
  weightsの値は機械学習により最適化が可能である。
  
  


*/

import React, {
  useContext,
  createContext,
  useRef,
  useEffect,
  useReducer,
  useState
} from 'react';
import { FirebaseContext } from "../Firebase/FirebaseProvider";
import { featureIndex } from '../message';

import { db } from './dbio';
import matrixizeWorker from "./engine/matrixize.worker";
import * as room from "./engine/room";

export const BiomebotContext = createContext();

let workers = {};

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
    initialPartOrder: ["peace"],
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
    partOrder: ["peace"],
    mentalLevel: 100,
    site: "",
    moment: 0,
    mood: "peace",
    queue: [], // 複数にわけた出力を保持
    futurePostings: [], // 
  },
  part: {
    "peace": {
      kind: "knowledge",
      initialMood: "peace",
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

// 更新頻度は低くdbには保存しないデータ
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
      let newWeights;

      // featureWeightsがなければ
      // featureWeights=[0.2,0.2...],featureBiases=0で初期化
      for (let partName in snap.parts) {
        if (!snap.parts[partName].featureWeights) {
          newWeights = nums(featureIndex.length, 1/10);
          newWeights[0] = 4 / 10; // ※先頭は1番
          snap.parts[partName].featureWeights = newWeights;
        }
      }
      console.log("parts",snap.parts)

      return {
        ...state,
        botId: snap.botId,
        displayName: snap.displayName,
        config: snap.config,
        main: snap.main,
        parts: {...snap.parts},
        estimator: snap.estimator,
      }
    }

    case 'readCache': {
      const cache = action.cache;
      const partName = action.partName;
      return {
        ...state,
        cache: {
          ...state.cache,
          [partName]: {...cache}
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

  const appState = props.appState;
  const handleBotFound = useRef(props.handleBotFound);
  const handleBotNotFound = useRef(props.handleBotNotFound);
  
  // ----------------------------------------------
  // stateが関数内関数（クロージャ）内で使われているためのworkaround
  // stateが変わるごとにstateRefは最新の値を指すようにする
  const stateRef = useRef(state);

  useEffect(()=>{
    stateRef.current = state;
  },[state]);

  // --------------------------------------------


  const handleExecute = (message, emitter) => {
    let snap;
    switch(work.site){
      case 'room':
        snap = room.execute(stateRef.current, work, message, emitter)
        break;
      default:
        throw new Error(`invalid site ${work.site}`)
    }
    setWork(prev => ({
      prev,
      ...snap
    }));
  }

  

  useEffect(() => {
    let isCancelled = false;

    if (!isCancelled) {
      if (appState === 'authOk' && fb.uid) {
        db.load(fb.uid)
          .then(snap => {
            if (snap) {
              dispatch({ type: 'connect', snap: snap });

              const snapWork = snap.work;
              console.log("useEffect setWork:",snapWork)
              setWork(prev => ({
                 key: prev.key + 1,
                 mentalLevel: snapWork.mentalLevel,
                 moment: snapWork.moment,
                 mood: snapWork.mood,
                 partOrder: [...snapWork.partOrder],
                 queue:[...snapWork.queue],
                 site: snapWork.site,
                 updatedAt: snapWork.updatedAt
              }));
              handleBotFound.current();
            }
            else {
              handleBotNotFound.current();
            }
          });
      }
    }

    return () => { isCancelled = true }
  }, [appState, fb.uid, state]);

  async function generate(obj, avatarPath) {
    // avatarPathをobjに組み込む
    obj.config.avatarPath = avatarPath;

    // indexDBへの書き込み
    await db.generate(obj, fb.uid);

    // stateへの書き込み
    dispatch({ type: 'connect', snap: obj });

    console.log("generate-setWork")
    setWork(prev => (
      {
        key: prev.key + 1,
        
        updatedAt: "",
        partOrder: [...obj.config.initialPartOrder],
        mentalLevel: obj.config.initialMentalLevel,
        moment: 0,
        site: "room",
        mood: "peace",
        queue: [],
        futurePostings: [],
        botId: fb.uid,
        
      }));
  }

  async function deploy(site) {
  
    for (let partName in state.parts) {

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
    
    if(work.site === "") {
      // スタートデッキの実行
      // * 未実装 *
    }

    setWork(prev => ({...prev, site: site}));

  }
  const photoURL = `/chatbot/${state.config.avatarPath}/${work.partOrder[0]}.svg`;

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

function nums(len,num){
  let x = Array(len);
  for(let i=0; i<len; i++){
    x[i]=num;
  }
  return x;
}