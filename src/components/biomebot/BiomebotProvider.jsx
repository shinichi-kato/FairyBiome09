/*
Biomebot
===============

複数の「心のパート」が相互作用しながら会話を形成するチャットボット

人の心には好奇心、共感、承認欲求、持っている知識を話したい、親密になりたい、
労り、怒り、上機嫌、意気消沈、眠い状態、などそれぞれ別個の意図に従って振る舞う
自己の様々な側面が共存している。それらは「心のパート」と呼ばれ、並列的・競争的に
動作し優勢になったものが入れ替わりながら返答を生成していると考えられる。
Biomebotはこれらパートを受け持つチャットボットをそれぞれ生成し、それらの
相互作用を通して一つの統合されたキャラクタを表現することを試みる。

## 心のパート

パートは以下のように階層と返答方式で分類される。

階層による分類             概要
---------------------------------------------------------------------------------
身体性パート               睡眠/覚醒のように身体的なコンディションに従うパート
感情性パート               喜び、悲しみ、怒り、嬉しさなどを表現するパート
思考性パート               趣味の話、相手への思いやり、好奇心、挨拶などのパート
---------------------------------------------------------------------------------

返答方式による分類     概要
---------------------------------------------------------------------------------
episode                  ユーザとチャットボットの発言を自動で辞書化し返答に使う
curiosity                辞書にない言葉をユーザから聞いて辞書化し返答に使う
knowledge                あらかじめ用意した辞書を使ってユーザのセリフに応答する。
---------------------------------------------------------------------------------

身体性パートは現実装では睡眠・覚醒であり、会話の流れと関係なく時刻に応じて
眠くなったり覚醒したりという挙動をする。内容は決まっているため主にknowledge型が
適する。
感情性パートは強いネガティブ表現を受け取ったときに思わずしてしまうような反応で、
様々な感情に伴って表出される。身体性パートと同様主にknowledge型でよいと思われる。
思考性パートはより高次の精神活動による会話に対応し、ユーザとの人間関係や
雑談、自己表現的なトピックを扱う。episode, curiosity, knowledgeのいずれもありうる。

### 覚醒/睡眠(身体性パート/knowledge型)

睡眠/覚醒は sleep, sleepy, wake という３つのパートで構成され、パラメータ
circadian:{
  wake: number(24hour),
  sleep: number(24hour),
  delta: number(min)
}
で定義し、これらにより下記のような台形の覚醒確率を表現する。

            -delta wake +delta     -delta sleep +delta
--------------------------------------------------------
覚醒状態確率    0%   50%  100%        100%   50%    0%

deploy時に覚醒チェックを行い、覚醒/睡眠の状態を決める。
このときwake状態であれば{enter_wake}がトリガされる。
覚醒中は10分おきに覚醒チェックを行い、失敗すると{enter_sleepy}がトリガされる。
sleepy状態では発言ごとに覚醒チェックが行われ、失敗すると{enter_sleep}が
トリガされる。

deploy時にsleep状態であればユーザ発言を受け取るごとに覚醒チェックを行い、
成功したら{enter_wake}がトリガされる。


### 喜怒哀楽(感情性パート/主にknowledge型)

感情の分類には一般に言われる喜怒哀楽(4種)やプルチックの感情の輪(24種)など
様々な種類があるが、最も基本的なモデルとして高揚(cheer)と消沈(down)の2種類を
考える。
感情性パートはユーザの発言により引き起こされる。また、{enter_cheer}、
{enter_down}というトリガにより明示的に遷移させることができる。
※検討中：感情性パートはチャットボット自身の発言によっても引き起こされる。


### 思考性パートの例

思考性パートはユーザが任意に設定できる。下記のようなパートが考えられる。

* 挨拶(思考性パート/knowledge)
* 天候の変化への反応(思考性パート/knowledge)
* 好奇心(思考性パート/curiosity)
* 思い出し(思考性パート/episode)


## パートのアバター

眠いときは思考は眠気によって影響され、好奇心を感じているときは気分が
高揚するというように、各心のパートには固有の気分が伴っている。これらを
表現するためパートごとに下記のようなアバターから一つを選ぶ。なお、趣味の
話題で最初の気分が平常で、話が盛り上がったら気分が高揚するなどの場合は
パートを分ける。話の盛り上がりはmomentで表現されており、momentUpper,
momentLowerを高めに設定することで盛り上がったときの会話を表現できる。
またアバターとしてサーバー上でchatbot.jsonと同じディレクトリに
配置された.svg画像を使用する。システム管理者は任意のsvg画像を同
ディレクトリに置くことで表情を追加することができる。

アバター名   概要
--------------------------------------------------------------
absent       不在
sleepy       眠い・・・覚醒/睡眠の身体性パートが使用
sleep        睡眠中・・・覚醒/睡眠の身体性パートが使用
wake         起床した・・・覚醒/睡眠の身体性パートが使用
peace        平常
cheer        盛り上がっている
down         落ち込んでいる
waving       手を振っている
--------------------------------------------------------------







## パート群の動作機序

チャットボット起動時はwork.partOrderはstate.initialPartOrderをコピーした
内容になり、その先頭にあるpartの{on_enter_part}が自動的に実行される。

チャットボットはメッセージを受け取るとwork.partOrderに格納された順番により
評価を行う。成功したら返答が生成され、返答を行ったパートをpartOrder先頭
または末尾に移動してパート評価から抜ける。
失敗したら順次次のパートの評価を試みる。

パート評価がすべて失敗だった場合はpartOrder配列に格納された順番に辞書の
NOT_FOUND出力を試みる。


## トリガとパート間遷移

パート間の遷移は発言文字列中の{enter_peace}や外部から明示的に与えたトリガ
で生じる。{enter_peace}というトリガが与えられると、peaceという名前の
パートがpartOrder先頭に移動するとともにそのパートの辞書で{on_enter_part}という
IN文字列に対応したOUT文字列が出力される。
辞書の中に{on_enter_part}に対応する記憶を与えておくことで状態が
変わったことで生じる自発的な応答を生成できる。

## トリガ

内部トリガは発言中の{enter_*}文字列、外部トリガはmessageクラスをtrigger
モードでインスタンス化することで作成できる。内部トリガは即座に評価され、
外部トリガをチャットボットに渡すとこのメッセージがキューの先頭に乗り、
partOrderにしたがって評価される。
トリガには上述のパート間遷移に加えて以下のようなものがある。

トリガの例
--------------------------------------------------------------------------
{enter_peace}   パート名を指定するとそのパートに遷移する。
{enter_rain}    天候や季節が変化したとき、いずれかのパートに
                {on_enter_rain}のようなINがあればその時のOUTの内容を発言
{positive}      mentalLevelやmomentにポジティブな影響が生じる
{negative}      mentalLevelやmomentにネガティブな影響が生じる
--------------------------------------------------------------------------



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


# チャットボットインスタンスの生成と保存

ユーザが最初にチャットボットを生成するときはテンプレートとして用意したチャットボットから
一つを選ぶか、過去に保存されたユーザのチャットボットのデータをロードして始める。
  
  ・ユーザ所有のチャットボットを生成した時点でサーバーへの保管が実行され、idが付与される。
  ・一日最大一回、FairyBiome起動時にタイムスタンプを確認しサーバー側が新しかったら
    ローカルにロードする。
  ・森に入るとチャットボットのデータは一日最大一回サーバーに保存される。
  ・編集モードから抜けるときにサーバーに保存される。

上述のチャットボット以外に、システムが利用するNPCチャットボットがある。これは特に
サーバーには保存されない。
チャットボットはローカルにも保存される。ユーザのチャットボットは最大一つまで保存され、
NPCチャットボットは保存される数に制限はない。
これらの動作を実装するため、チャットボットにはサーバーが付与するidと作成者のidを保持する。
NPCには所有者のidを与えない。これにより、ローカルに保存できるデータのうち所有者idの
あるものは一つだけに限定する。


  1. bot.generate(obj)
    objにチャットボットの全データを格納して渡す
  
  2. 

  ## state.status
  status    | 説明
  ----------|----------
  unload    | データがロードされる前
  loaded    | データがロードされた
  deploying | cache計算中
  ready     | 実行可能

*/

import React, {
  useContext,
  createContext,
  useRef,
  useEffect,
  useReducer,
  useState,
  useCallback,
} from 'react';

import { AuthContext } from "../Auth/AuthProvider";
import { featureIndex } from '../message';

import { db } from './dbio';
import matrixizeWorker from "./engine/matrixize.worker";
import * as dialogue from "./engine/dialogue";
import * as polylogue from "./engine/polylogue";

export const BiomebotContext = createContext();


let workers = {};
let executes = {
  'room': dialogue.execute,
  'park': polylogue.execute,
  'forest': dialogue.execute,
}


// チャットボットデータの初期値
export const defaultSettings = {
  botId: null,
  config: {
    description: "",
    backgroundColor: "#eeeeee",
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
    keepAlive: 10,
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
    status: "",
    partOrder: ["peace"],
    mentalLevel: 100,
    site: "room",
    moment: 0,
    queue: [], // 複数にわけた出力を保持
    futurePostings: [], // 
    userLastAccess: 0 // date.getTime()
  },
  parts: {
    "peace": {
      kind: "knowledge",
      avatar: "peace",
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
  status: "unload",
  botId: null,
  displayName: "",
  config: {},
  parts: {},
  cache: {},

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
          newWeights = nums(featureIndex.length, 1 / 10);
          newWeights[0] = 4 / 10; // ※先頭は1番
          snap.parts[partName].coeffs = {
            weights: newWeights,
            biases: nums(featureIndex.length, 0)
          };
        }
      }

      return {
        status: "loaded",
        botId: snap.botId,
        displayName: snap.displayName,
        config: snap.config,
        main: snap.main,
        parts: { ...snap.parts },
      }
    }

    case 'readCache': {
      const partName = action.partName;
      const cache = {
        ...state.cache,
        [partName]: { ...action.cache }
      };
      // キャッシュ計算中はstatusがdeploying, 計算終了時にreadyになる
      const cacheKeys = Object.keys(cache);
      const partsKeys = Object.keys(state.parts);

      const status = cacheKeys.length === partsKeys.length ? "ready" : "deploying";
      console.log("status", status)
      return {
        ...state,
        cache: { ...cache },
        status: status
      }
    }

    case 'saveConfig': {
      const config = action.config;
      return {
        ...state,
        config: {
          description: config.description,
          backgroundColor: config.backgroundColor,
          avatarPath: config.avatarPath,
          circadian: { ...config.circadian },
          initialMenatalLevel: config.initialMentalLevel,
          initialPartOrder: [...config.initialPartOrder],
          hubBehavior: { ...config.hubBehavior },
          keepAlive: config.keepAlive
        }
      }
    }

    case 'saveMain': {
      return {
        ...state,
        main: { ...action.main }
      }
    }

    case 'movePart': {
      const { prevName, newName, data } = action.data;

      let parts = { ...state.parts };
      delete parts[prevName];
      parts[newName] = { ...data }

      // part名はconfig.partOrderにも書かれているのでそれを変更
      // ※scriptの移動は別途
      let partOrder = [...state.config.initialPartOrder];
      const index = partOrder.indexOf(prevName);
      if (index !== -1) {
        partOrder.splice(index, 1, newName);
      } else {
        partOrder.unshift(newName);
      }

      return {
        ...state,
        config: {
          ...state.config,
          circadian: {
            ...state.config.circadian,
          },
        },
        parts: parts,
      }
    }

    case 'addPart': {
      const {name, data} = action.data;

      let partOrder = [...state.config.initialPartOrder, name];

      return {
        ...state,
        config: {
          ...state.config,
          partOrder:partOrder,
        },
        parts: {
          ...state.parts,
          [name]: data,
        }
      }
    }

    case 'updatePart': {
      const { prevName, data } = action.data;
      return {
        ...state,
        parts: {
          ...state.parts,
          [prevName]: {
            ...data
          }
        }
      }
    }

    default:
      throw new Error(`invalid action ${action}`);
  }
}

export default function BiomebotProvider(props) {
  // -----------------------------------------------------
  //
  // state      
  // -----------------------------------------------------
  // unload     初期化状態
  // loaded     データがロードされた
  // deploying  tfidf行列のキャッシュ計算/読み込み中
  // ready      tfidf行列の準備が完了した
  // -----------------------------------------------------


  const auth = useContext(AuthContext);

  const [state, dispatch] = useReducer(reducer, initialState);
  const [work, setWork] = useState({
    key: 0,
    ...defaultSettings.work
  });

  // const appState = props.appState;
  const handleBotFound = useRef(props.handleBotFound);  // 外に持ち出したのでクロージャになる
  const handleBotNotFound = useRef(props.handleBotNotFound);


  // ----------------------------------------------------------------------
  // 認証後にユーザのチャットボットが存在するか確認
  // チャットボット不在の状態もあるのでロードはしない
  // 

  useEffect(() => {
    if (props.appState === 'authOk' && !state.botId && auth.uid) {
      // クロージャなのでref化した関数を使用
      (async () => {
        if (await db.isExist(auth.uid)) {
          handleBotFound.current();
        } else {
          handleBotNotFound.current();
        }
      })();
    }

  }, [props.appState, auth.uid, state]);

  // ------------------------------------------------------------------------
  // チャットボットがロードされたらデプロイする
  //

  useEffect(() => {
    if (state.status === 'loaded') {
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
      if (work.site === "") {
        // スタートデッキの実行
        // * 未実装 *
      }

      // setWork(prev => ({
      //   ...prev,
      //   key: prev.key + 1,
      // }));

    }

  }, [state.botId, state.status, state.parts, work.site]);



  // ------------------------------------------------------------------------
  //
  //  稼働状態のチャットボットがqueueを消費する
  //

  useEffect(() => {

    if (state.status === 'ready') {
      console.log("remaining queues", work.queue.length)
      if (work.queue.length > 0) {
        setWork(prev => {
          const top = prev.queue[0];
          const newWork = {
            ...prev,
            key: prev.key + 1,
            queue: prev.queue.slice(1)
          };

          return {
            key: prev.key + 1,
            ...executes[work.site](state, newWork, top.message, top.emitter),
          }
        });
      }
    }
  }, [state, state.status, work, work.queue]);


  const handleExecute = (message, emitter) => {
    // 外部からの入力を受付け、必要な場合返答を送出する。
    // deploy完了前に呼び出された場合はqueueに積む

    console.log("message text",message.text)
    if (state.status !== 'ready') {
      setWork(prev => ({
        ...prev,
        key: prev.key + 1,
        queue: [...prev.queue,
        { message: message, emitter: emitter }
        ],

      }));
    } else {
      setWork(prevWork => ({
        key: prevWork.key + 1,
        ...executes[work.site](state, prevWork, message, emitter)
      })
      );
    }
  }

  async function addNewPart() {
    const newPart = await db.addPart(state.botId);
    // partOrder末尾に新パート追加
    dispatch({type:'addPart',...newPart});
    // 空のスクリプトを追加<ーここから

  }

  const generate = useCallback(async (obj, id, site) => {
    // staticやfirestoreに保存されたチャットボット情報を新規に読み込む。
    //
    // contextに含める関数がuseContextする側のコンポーネントでのuseEffect内で
    // 使われる場合、useEffectの内容が非同期的に処理されても適切に
    // アップデートされた状態に保つためuseCallback化する。それにより
    // 利用側コンポーネントのuseEffectでdepsに含める必要がなくなる。 

    // displayNameを復元
    obj.displayName = obj.main.NAME;

    // indexDBへの書き込み
    await db.generate(obj, id);

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
        site: site,
        queue: [],
        futurePostings: [],
        botId: id,
        userLastAccess: 0
      }));
  }, []);

  const load = useCallback(async (botId, site) => {
    // チャットボットを読み込む。
    // 読み込みが完了したらuseEffectで自動deployされる。
    //
    // contextに含める関数がuseContextする側のコンポーネントでのuseEffect内で
    // 使われる場合、useEffectの内容が非同期的に処理されても適切に
    // アップデートされた状態に保つためuseCallback化する。それにより
    // 利用側コンポーネントのuseEffectでdepsに含める必要がなくなる。


    site ||= 'room';

    if (botId) {
      const snap = await db.load(botId);
      if (snap) {
        dispatch({ type: 'connect', snap: snap });

        const snapWork = snap.work;
        setWork(prev => ({
          key: prev.key + 1,
          mentalLevel: parseInt(snapWork.mentalLevel),
          moment: parseInt(snapWork.moment),
          partOrder: [...snapWork.partOrder],
          queue: [...prev.queue,...snapWork.queue],
          site: site,
          updatedAt: snapWork.updatedAt,
          futurePosting: [],
          botId: botId,
          userLastAccess: parseInt(snapWork.userLastAccess)
        }));
        return snap;
      }
      else {
      }
    }
  }, [])


  async function save(dest, obj, partName) {
    /* チャットボットのデータをdbに保存し、今のチャットボットにも反映 */

    switch (dest) {
      case 'config': {
        await db.saveConfig(state.botId, obj);
        dispatch({ type: 'saveConfig', config: obj });
        return;
      }

      case 'main': {
        await db.saveMain(state.botId, obj);
        dispatch({ type: 'saveMain', main: obj });
        return;
      }

      case 'work': {
        await db.saveWork(state.botId, obj);
        setWork(prev=>({
          key: prev.key+1,
          ...obj
        }));
        return;
      }

      case 'part': {
        if (obj.prevName !== obj.newName) {
          // partの名前が変更された場合、旧partを削除して新partを追加する。
          // 加えてconfigのpartOrderにあるpartNameを置き換える。
          await db.movePart(state.botId, obj);
          dispatch({ type: 'movePart', data: obj })
        } else {
          // 既存partのアップデート
          await db.updatePart(state.botId, obj);
          dispatch({ type: 'updatePart', data: obj });
        }
        return;
      }

      case 'script': {
        await db.saveScript(state.botId, partName, obj);
        return;
      }

      default:
        throw new Error(`invalid dest ${dest}`);
    }
  }

  async function loadScript(partName) {
    return await db.loadScript(state.botId, partName);

  }

  function exportJson(){
    // db上のデータをjson形式で出力
    return {}
  } 

  const topPart = work.partOrder[0];
  const currentPart = state.parts[topPart];
  const avatar = currentPart ? currentPart.avatar : 'peace';
  const photoURL = `/chatbot/${state.config.avatarPath}/${avatar}.svg`;

  return (
    <BiomebotContext.Provider
      value={{
        execute: handleExecute,
        generate: generate,
        save: save,
        addNewPart: addNewPart,
        loadScript: loadScript,
        load: load,
        exportJson: exportJson,
        state: state,
        work: work,
        photoURL: photoURL,
      }}
    >
      {props.children}
    </BiomebotContext.Provider>
  );
}

function nums(len, num) {
  let x = Array(len);
  for (let i = 0; i < len; i++) {
    x[i] = num;
  }
  return x;
}