import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, serverTimestamp, doc, setDoc, addDoc, collection } from 'firebase/firestore';

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

    this.generate = this.generate.bind(this);
  }

  // --------------------------------------------------------------------
  //
  //
  //  firestoreへの書き込み関数
  //
  //
  // --------------------------------------------------------------------

  async generate(obj, uid) {
    // chatbot.jsonから読み込んだobjの内容をfirestoreに新規に書き込む。
    // obj.botIdが未定義のものはデータベースにaddし、botIdとtimestampを返す。
    // obj.botIdが定義されているものは上書きする。ownerIdが'system'の場合
    // NPCチャットボットなのでfirestoreには保存しない。
    // firestoreでは以下のようなツリー構造を用い、各docにはtimestampを設定する。
    //
    // collection bot
    //    └doc (config, work, part, timestamp)
    //          └collection script
    //                └doc(partScript, timestamp)
    //          └collection main
    //                 └doc(mainDict, timestamp)

    if (obj.ownerId === 'system') {
      console.log("NPCチャットボットはfirestoreに保存しません")
      return false;
    }

    let botId = obj.botId;

    let data = {
      config: obj.config,
      ownerId: uid,
      site: obj.site,
      estimater: obj.estimeter,
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
        featureWeights: p.featureWeights,
      }
    }

    let botRef;
    if (obj.botId) {
      // botIdがある→以前保存されているので上書き
      botRef = doc(firestore, "bots", botId);
      await setDoc(botRef, data);
    }
    else {
      // botIdがない→新規作成でidを得る
      botRef = await addDoc(collection(firestore, "bots"), data);
    }
    // partScriptの保存:以降botIdを使って書き込み
    botId = botRef.id;

    const partRef = collection(botRef, "parts")

    // スクリプトの保存
    for (let partName in obj.parts) {
      await setDoc(partRef, obj.parts[partName], partName);
    }
  }

}

export const fbio = new Fbio();
