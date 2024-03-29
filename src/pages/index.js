/*
  チャット画面

  firestoreの構成
  parkのログ
  log

  
*/

import React, { useState, useEffect, useRef, useCallback } from "react";
import { graphql, navigate } from "gatsby";

import Landing from '../components/Landing/Landing';
import ChatRoom from '../components/ChatRoom/ChatRoom';
import AuthProvider from '../components/Auth/AuthProvider';
import EcosystemProvider from '../components/Ecosystem/EcosystemProvider';
import BiomebotProvider from '../components/biomebot/BiomebotProvider';

import { initializeFirebaseApp, firebaseApp, firestore } from '../firebase';

import {
  collection, query as fsQuery, onSnapshot, orderBy, limit,
  addDoc, serverTimestamp
} from 'firebase/firestore';

import Dexie from "dexie";
import { Message } from '../components/message';

export const query = graphql`
query indexq {
  site {
    siteMetadata {
      version
      chatbot {
        logViewLength
        logStoreLength
        forestEncounter {
          randomSeed
          changeRate
          tutor
          usersFairy
        }
      }
    }
  }
}`

let db = null;

async function readLocalLog(site, number, offset) {
  /* siteのログをoffsetからnumber件読み出す */
  let payload = [];
  const siteDb = site === 'room' ? db.room : db.forest;

  if (offset) {

    payload = await siteDb
      .orderBy("timestamp")
      .offset(offset)
      .limit(number)
      .toArray()

  } else {

    payload = await siteDb
      .orderBy("timestamp")
      .reverse()
      .limit(number)
      // ここで.reverse()するとうまく動作しない。
      // toArray()したあとでそれをreverseする。
      .toArray();

    payload.reverse();
  }
  return payload.map(msg => new Message(msg));
}

async function writeLog(message) {
  const site = message?.site;
  if (site === 'forest' || site === 'room') {

    let id = await db[site].add(message);
    message.id = id;
  }
  else if (site === 'park') {
    const data = {
      text: message.text,
      name: message.name,
      timestamp: serverTimestamp(),
      avatarPath: message.avatarPath,
      features: message.features
    }
    const d = await addDoc(collection(firestore, "parklog"), data);
    message.id = d.id;
  } else {
    console.log('invalid message',message)
  }

  return message;
}

export default function IndexPage({ data }) {
  /* 
    チャットルームアプリのフレームワーク

    アプリ基幹部分の状態遷移を管理。

    appState
    ---------------------------------------------------------
    'landing'       アプリ起動時。初期化などを実行中。
    'authOk'        firebaseのauthが完了するとauthOkになり、ローカルの
                    チャットボットを探す。
    'new'           チャットボットが見つからない場合、タイトルページに「はじめから」が
                    表示される
    'continue'      チャットボットが見つかり、タイトルページに「はじめから」と
                   「チャットルームに入る」が表示された状態
    'chatroom'      チャットルームが実行中
  
    IndexPageコンポーネントではroomおよびforestのログを管理し、
    他のコンポーネントがログにアクセスする手段を提供する。

    site      チャットルーム入室時の挙動
    ---------------------------------------------------------------------------
    room      indexDBに保存されユーザが所有するチャットボットを読み込む
    park      indexDBに保存されユーザが所有するチャットボットを読み込む
    forest    indexDBやfirestoreに保存されたいずれかのチャットボットを読み込む
              チャットボット不在の場合もある
    ---------------------------------------------------------------------------
  */

  const [appState, setAppState] = useState('Landing');
  const [parkLog, setParkLog] = useState([]);
  const [forestLog, setForestLog] = useState([]);
  const [roomLog, setRoomLog] = useState([]);
  const [parkSpeech, setParkSpeech] = useState(); // parkで外から入ってきた発言
  const unsubscribeRef = useRef();

  const config = data.site.siteMetadata.chatbot;
  const version = data.site.siteMetadata.version;

  // --------------------------------------------------------------
  // ログdbの初期化

  useEffect(() => {
    if (!db) {
      db = new Dexie('Log');
      db.version(1).stores({
        room: "++id,timestamp", // id, timestamp, message
        forest: "++id,timestamp", // id, timestamp, message
      });
    }

    (async () => {
      setForestLog(await readLocalLog('forest', config.logViewLength));
      setRoomLog(await readLocalLog('room', config.logViewLength));
    })();

  }, [config.logViewLength]);

  // --------------------------------------------------------------
  // firebaseの初期化
  // parkログのサブスクリプションを開始

  useEffect(() => {
    if (!firebaseApp) {
      initializeFirebaseApp();
    };

    return (() => {
      console.log("unsubscribing")
      if (unsubscribeRef.current) { unsubscribeRef.current(); }
    })
  }, []);

  useEffect(() => {
    if (appState !== 'landing' && !unsubscribeRef.current) {
      const q = fsQuery(collection(firestore, "parklog"),
        orderBy('timestamp'), limit(100));

      unsubscribeRef.current = onSnapshot(q, (snap) => {
        if (parkLog.length === 0) {
          // 起動時は一括取得
          let log = [];
          snap.forEach(doc => {
            let m = new Message(doc.data());
            m.id = doc.id;
            log.push(m);
          })
          setParkLog(log);

        } else {

          // 以降は都度取得
          snap.docChanges().forEach((change) => {
            if (change.type === 'added') {
              let m = new Message(change.doc.data());
              m.id = change.doc.id;
              setParkLog(prev=>[...prev,m]);
              // ここでチャットボット学習用のログを取る
            }
          }
          )
        }
      });
    }

  }, [appState]);


  const handleWriteLog = useCallback(message => {
    /* ログの書き込み
      この関数自体には依存関係がないが、context消費側のuseEffect()内で利用されるため
      callback化する。それによりrenderが繰り返されてもアドレスが変わらなくなる。
    */
    (async () => {
      const m = await writeLog(message);
      switch (message.site) {
        case 'room':
          setRoomLog(prev => [...prev, m]);
          break;
        case 'forest':
          setForestLog(prev => [...prev, m]);
          break;
        case 'park':
          break;
        default:
          throw new Error(`invalid site ${message.site}`)
      }
    })()
  }, []);

  function handleBotFound() { setAppState('continue'); }
  function handleBotNotFound() { setAppState('new'); }
  function handleContinue() { setAppState('chatroom'); }
  function handleExitRoom() { setAppState('continue'); }

  function handleNew() {
    setAppState('authOk');
    navigate('/create/');
  }

  return (

    <AuthProvider
      firebase={firebaseApp}
      firestore={firestore}
      handleAuthOk={() => setAppState('authOk')}
    >
      <EcosystemProvider
        writeLog={handleWriteLog}
      >
        <BiomebotProvider
          appState={appState}
          writeLog={handleWriteLog}
          handleBotNotFound={handleBotNotFound}
          handleBotFound={handleBotFound}
        >
          {appState === 'chatroom' ?
            <ChatRoom
              writeLog={handleWriteLog}
              roomLog={roomLog}
              forestLog={forestLog}
              parkLog={parkLog}
              handleExitRoom={handleExitRoom}
              config={config}
            />
            :
            <Landing
              appState={appState}
              handleNew={handleNew}
              handleContinue={handleContinue}
              version={version}
            />
          }
        </BiomebotProvider>
      </EcosystemProvider>
    </AuthProvider>
  )
}