import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  getFirestore, serverTimestamp,
  doc, setDoc, addDoc, collection, getDoc
} from 'firebase/firestore';

export let firebaseApp = null;
export let firestore = null;

export function initializeFirebaseApp() {
  if (window !== undefined) {
    if (getApps().length === 0) {
      firebaseApp = initializeApp({
        apiKey: process.env.GATSBY_FIREBASE_API_KEY,
        authDomain: process.env.GATSBY_FIREBASE_AUTH_DOMAIN,
        databaseURL: process.env.GATSBY_FIREBASE_DATABASE_URL,
        projectId: process.env.GATSBY_FIREBASE_PROJECT_ID,
        storageBucket: process.env.GATSBY_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.GATSBY_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.GATSBY_FIREBASE_APP_ID,
      });
    }
    else {
      firebaseApp = getApp();
    }
    firestore = getFirestore(firebaseApp);
  }
}

class Fbio {
  constructor() {

    this.load = this.load.bind(this);
    this.loadScript = this.loadScript.bind(this);
    this.save = this.save.bind(this);
    this.saveScript = this.saveScript.bind(this);
  }

  // --------------------------------------------------------------------
  //
  //
  //  firestoreへのチャットボットデータの書き込み
  //
  //
  // --------------------------------------------------------------------

  async save(obj, uid) {
    /* 
       objの内容をfirestoreに新規または上書き保存。

       ユーザはfirestoreにあるチャットボットをロードするか、chatbot.jsonから
       チャットボットを新規作成できる。ユーザが作成したチャットボットの
       データは最大10件保存でき、それ以上の数を保存しようとすると古いものが
       削除される。firestoreへの保存は一日最大一回森に入ったとき、
       チャットボット編集画面でアップロードを実行したときに行われる。

       firestoreに初めて保存される場合、config.fsBotIdとconfig.ownerIdがnullである。
       まずconfig.ownerIdにはuidの値をコピーし、objの内容をaddした後idを取得して
       config.fsBotIdにコピーする。

       firestoreでは以下のようなツリー構造を用い、各docにはtimestampを設定する。
      
       collection bot
          └doc (config, work, part, timestamp)
                └collection script
                      └doc(partScript, timestamp)
                └collection main
                       └doc(mainDict, timestamp)
    */
    console.log(obj, uid)
    let data = {
      config: {
        ...obj.config,
        ownerId: uid
      },
      estimator: obj.estimator,
      timestamp: serverTimestamp(),
      work: obj.work,
      parts: {},
      main: obj.main
    };

    for (let partName in obj.parts) {
      const p = obj.parts[partName];
      data.parts[partName] = {
        kind: p.kind,
        momentUpper: p.momentUpper,
        momentLower: p.momentLower,
        precision: p.precision,
        retention: p.retention,
        cacheTimestamp: p.cacheTimestamp,
        featureWeights: p.featureWeights || null,
      }
    }

    let fsBotId = obj.config.fsBotId;
    let botRef;
    if (fsBotId) {
      // botIdがある→以前保存されているので上書き
      botRef = doc(firestore, "bots", fsBotId);
      await setDoc(botRef, data);
    }
    else {
      // botIdがない→新規作成でidを得る
      botRef = await addDoc(collection(firestore, "bots"), data);
    }
    // partScriptの保存:以降botIdを使って書き込み
    fsBotId = botRef.id;

    // スクリプトの保存
    for (let partName in obj.parts) {
      await this.saveScript(fsBotId, partName, obj.parts[partName].script);
    }

    return fsBotId;
  }

  async saveScript(id, partName, script) {
    /*
      obj形式の場合scriptの内容は以下のようになっている。

     [
        {
            "in": "{enter_greeting}",
            "out": "こんにちは。{user}さん。どうしたんですか？"
        },
        {
            "in": "{enter_morning}",
            "out": "おはようございます！"
        },

      この順番を保持してfirestoreに書き込む。firestoreはネストした配列を
      サポートしないので 
      {
        id: 0,
        in: [...in],
        out: [...out],
      }        
      というオブジェクトに変換して保存する 
      */
    const scriptsRef = collection(firestore, `bots/${id}/scripts`);

    let s = {};
    for (let i = 0, l = script.length; i < l; i++) {
      const n = script[i];
      s[i] = { in: n.in, out: n.out }
    }

    console.log("script", partName, script, s)

    await setDoc(doc(scriptsRef, partName),
      {
        script: script,
        timestamp: serverTimestamp()
      });

  }

  // --------------------------------------------------------------------
  //
  //
  //  firestoreからのチャットボットデータの読み込み
  //
  //
  // --------------------------------------------------------------------

  async load(botId) {
    // save周りができたのでここからコーディング
    const docRef = doc(firestore, "bots", botId);
    const docSnap = await getDoc(docRef);
    const obj = docSnap.data();

    // partsの読み込み
    for (let partName of Object.keys(obj.parts)) {
      // load未実装
      // saveは fbioに記述loadも移す
    }
  }

  async loadScript(id, partName) {
    const scriptsRef = collection(firestore, 'bots/{id}')
  }

}

export const fbio = new Fbio();
