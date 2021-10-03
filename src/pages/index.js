/*
  チャット画面

  firestoreの構成
  parkのログ
  log

*/
import React, { useState, useEffect } from "react";
import { graphql, navigate } from "gatsby";

import Landing from '../components/Landing/Landing';
import ChatRoom from '../components/ChatRoom/ChatRoom';
import AuthProvider from '../components/Auth/AuthProvider';
import EcosystemProvider from '../components/Ecosystem/EcosystemProvider';
import BiomebotProvider from '../components/biomebot/BiomebotProvider';

import { initializeApp, getApp, getApps } from 'firebase/app';

import {
  getFirestore,
  collection, query as fsQuery, onSnapshot, orderBy, limit,
  doc, addDoc, serverTimestamp
} from 'firebase/firestore';

import Dexie from "dexie";
import { Message } from '../components/message';

export const query = graphql`
query indexq {
  site {
    siteMetadata {
      chatbot {
        logViewLength
        logStoreLength
      }
    }
  }
}`

let db = null;
let firebaseApp = null;
let firestore = null;

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
  const site = message.site;
  if (site === 'forest' || site === 'room') {

    let id = await db[site].add(message);
    message.id = id;
  } 
  else if (site === 'park'){
    const data = {
      test: message.text,
      name: message.name,
      timestamp: serverTimestamp(),
      avatarPath: message.avatarPath,
      features: message.features
    }
    const d = await addDoc(doc(firestore, "log"), data);
    message.id = d.id;
  }

  return message;
 }


export default function IndexPage({ data }) {
  /* 
    チャットルームアプリのフレームワーク

    アプリ基幹部分の状態遷移を管理。

    appState
    ---------------------------------------------------------
    'landing'       起動時はlanding状態。
    'authOk'        firebaseのauthが完了するとauthOkになり、ローカルの
                    チャットボットを探す。
    'new'           チャットボットが見つからない場合、タイトルページに「はじめから」が
                    表示される
    'continue'      チャットボットが見つかり、タイトルページに「はじめから」と
                   「チャットルームに入る」が表示された状態
    'chatroom'      チャットルームが実行中
  
    IndexPageコンポーネントではroomおよびforestのログを管理し、
    他のコンポーネントがログにアクセスする手段を提供する。
  */

  const [appState, setAppState] = useState('Landing');
  const [parkLog, setParkLog] = useState([]);
  const [forestLog, setForestLog] = useState([]);
  const [roomLog, setRoomLog] = useState([]);

  const logs = { park: parkLog, forest: forestLog, room: roomLog };
  const setLogs = {forest: setForestLog, room: setRoomLog};

  const config = data.site.siteMetadata.chatbot;

  useEffect(() => {
    let isCancelled = false;

    if (!db && !isCancelled) {
      db = new Dexie('Log');
      db.version(1).stores({
        room: "++id,timestamp", // id, timestamp, message
        forest: "++id,timestamp", // id, timestamp, message
      });

      (async () => {
        setForestLog(await readLocalLog('forest', config.logViewLength));
        setRoomLog(await readLocalLog('room', config.logViewLength));
      })();
    }

    return () => { isCancelled = true };
  }, [config.logViewLength]);

  useEffect(()=>{
    let isCancelled = false;
    let unsubscribe;

    if(!firebaseApp &&!isCancelled){
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
        const q = fsQuery(collection(firestore, "log"),
        orderBy('date'),
        limit(100));

        unsubscribe = onSnapshot(q, snap => {

          setParkLog(snap.data());

      });
      }
    }
    return (()=>{ 
      isCancelled = true;
      unsubscribe();
    });
    
  },[]);

  function handleWriteLog(message){
    (async ()=>{
      const m = await writeLog(message)
      setLogs[message.site](prev=>[...prev, m]);

    })()
  }

  function handleAuthOk() { setAppState('authOk'); }
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
      firebase ={firebaseApp}
      handleAuthOk={handleAuthOk}
    >
      <EcosystemProvider
        writeLog={writeLog}
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
              logs={logs}
              handleExitRoom={handleExitRoom}
            />
            :
            <Landing
              appState={appState}
              handleNew={handleNew}
              handleContinue={handleContinue}
            />
          }
        </BiomebotProvider>
      </EcosystemProvider>
    </AuthProvider>
  )
}