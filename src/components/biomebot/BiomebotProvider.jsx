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
  行っている。Messageにはテキスト、タイムスタンプ、ユーザ名の他に様々なfeatureが
  格納されており、テキスト部分はtfidfによりcos類似度計算を行ってスコアとする。
  その他のfeatureはいずれもone-hotベクターであり、weights、biasesで与えられる
  重み付けを行ってスコアを計算し、text、fvの合計を全体のスコアとする。
  wieghtsとbiasesの初期値はchatbot.jsonに格納する。なお、指定しない場合は
  weights=1,biases=0とする。

  ## [将来]機械学習
  weightsとbiasesの値は機械学習により最適化が可能である。
  
  


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
  zeros,
  reviver
} from "mathjs";
import { FirebaseContext } from "../Firebase/FirebaseProvider";
import Message, {featuresDict} from '@material-ui/icons/Message';

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
    queue: [],
    futurePostings: []
  },

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
      
      // featureWeights,featureBiasesがなければ
      // featureWeights=[1,0.2,0.2...],featureBiases=0で初期化
      for(let partName in snap.parts){
        if(!snap.parts[partName].featureWeights){
          let newWeights = ones(featuresDict.length) * 0.2;
          newWeights[1] = 1; // ※先頭は1番
          snap.parts[partName].featureWeights =　newWeights; 
        }
        if(!snap.parts[partName].featureBiases){
          snap.parts[partName].featureBiases = zeros(featuresDict.length);
        }
      }

      return {
        botId: snap.botId,
        displayName: snap.displayName,
        config: snap.config,
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
    work: defaultSettings.work
  });

  const [execute, setExecute] = useState(
    () => async (st, wk, msg, sendMessage) => {
      /* postMessageToBot 関数
        st: state
        wk: work
        msg: Message型データ
        sendMessage: ({message}) => {}
          チャットボットからのメッセージを発信するcallback関数

        初期状態はecho
      */
      const reply = new Message('system', {
        text: `est=${msg.estimation}`,
        site: 'room',
      });

      // setWork

      // await sendMessage({ message: reply })
    }
  )

  function handleExecute(message){
    execute(state,work,message,sendMessageFromBot)
      .then(workSnap=>{
        setWork(prev=>({
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
              setWork(prev => ({ key: prev.key + 1, work: snap.work }));
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

  async function generate(obj) {
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

  async function deploy(site,handleRecieveMessageFromBot) {
  
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

    // siteごとのモジュール切り替え
    switch(site){
      case 'room': 
        setExecute(()=>async (st,wk,msg,sm) => room.execute);
    }
  }



  return (
    <BiomebotContext.Provider
      value={{
        submit: handleSubmit,
        generate: generate,
        deploy: deploy,
        state: state,
      }}
    >
      {props.children}
    </BiomebotContext.Provider>
  );
}