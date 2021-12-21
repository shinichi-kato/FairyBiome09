import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, serverTimestamp,
  doc, setDoc, addDoc, collection,
  query, where, orderBy, limit, getDocs
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
    /* 
       objの内容をfirestoreに新規に書き込む。

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
    let botRef;
    if (obj.config.fsBotId) {
      // botIdがある→以前保存されているので上書き
      botRef = doc(firestore, "bots", obj.config.fsBotId);
      await setDoc(botRef, data);
    }
    else {
      // botIdがない→新規作成でidを得る
      botRef = await addDoc(collection(firestore, "bots"), data);
    }
    // partScriptの保存:以降botIdを使って書き込み
    let fsBotId = botRef.id;

    const partRef = collection(botRef, "parts")

    // スクリプトの保存
    for (let partName in obj.parts) {
      const data = {
        ...obj.parts[partName],
        featureWeights: obj.parts[partName].featureWeights || null
      };
      console.log(data)
      await setDoc(doc(partRef, partName), data);
    }

    return fsBotId;
  }

  async listBots(userId){
    /* 同じuserIdのbotを新しい順に最大5件読み込む。返すデータは/pages/create.jsの
    graphql`
      {
        allJson {
          nodes {
            main {
              NAME
              CREATOR_NAME
            }
            parent {
              ... on File {
                relativeDirectory
              }
            }
            config {
              backgroundColor
              description
            }
          }
        }
      }
    `
      と互換にする

    */
    const botsRef = collection(firestore, "bots");
    const q = query(botsRef, 
        where("ownerId", "==", userId),
        orderBy("timestamp"),
        limit(5));

    const querySnapshot = await getDocs(q);
    let nodes = [];

    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      const d = doc.data();
      //データ整形から実装
      nodes.push({
        main:{
          NAME: d.main.NAME,
          CREATOR_NAME: d.main.CREATOR_NAME,
        },
        parent: {
          relativeDirectory: d.parent.relativeDirectory
        },
        config: {
          backgroundColor: d.config.backgroundColor,
          description: d.config.description
        }
      })
    });

    return nodes;
  }

}

export const fbio = new Fbio();
