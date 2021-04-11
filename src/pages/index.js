import React, { useState, useEffect } from "react";
import { graphql, navigate } from "gatsby";

import Landing from '../components/Landing/Landing';
import ChatRoom from '../components/ChatRoom/ChatRoom';
import FirebaseProvider from '../components/Firebase/FirebaseProvider';
import EcosystemProvider from '../components/Ecosystem/EcosystemProvider';
import BiomebotProvider from '../components/Biomebot/BiomebotProvider';

import Dexie from "dexie";

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
  const [roomLog, setRoomLog] = useState([]);
  const [forestLog, setForestLog] = useState([]);

  const logs = { room: roomLog, forest: forestLog };
  const setLogs = {room: setRoomLog, forest: setForestLog };

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
        setForestLog(await readLog('forest'));
        setRoomLog(await readLog('room'));
      })();
    }

    return () => { isCancelled = true };
  }, []);


  async function writeLog(message) {
    const site = message.site;
    if(site === 'forest' || site === 'room'){

      const id = await db[site].add(message);
  
      setLogs[site](prev => ([...prev,{id:id,...message}]));
  
      /*
      const count = db[site].count();
      const exceeded = count - config.logStoreLength;
      ここで古いログを削除
      */
    
    } else if (site === 'park'){

      /* firebaseへの書き込み*/

    } else {
      throw new Error(`invalid site ${site}`);
    }
  }

  async function readLog(site, startId, number) {
    /* siteのログをstartIdからnumber件読み出す */
    number ||= config.logViewLength;
    let payload = [];
    const siteDb = 'room' ? db.room : db.forest;

    if (startId) {

      const start = await siteDb
        .where({ id: startId })
        .first();
      payload = await siteDb
        .where("timestamp")
        .below(start.timestamp)
        .sortBy("timestamp")
        .limit(number)
        .toArray()

    } else {

      payload = await siteDb
        .orderBy("timestamp")
        .limit(number)
        .toArray()
    }

    return payload;
  }

  function handleAuthOk() {setAppState('authOk'); }
  function handleBotFound() { setAppState('continue'); }
  function handleBotNotFound() { setAppState('new'); }
  function handleContinue() { setAppState('chatroom'); }
  function handleExitRoom() { setAppState('continue'); }

  function handleNew() {
    setAppState('authOk');
    navigate('/create/');
  }
  
  return (
    <FirebaseProvider
      handleAuthOk={handleAuthOk}
    >
      <EcosystemProvider
        writeLog={writeLog}
      >
        <BiomebotProvider
          appState={appState}
          writeLog={writeLog}
          handleBotNotFound={handleBotNotFound}
          handleBotFound={handleBotFound}
        >
          {appState === 'chatroom' ?
            <ChatRoom
              writeLog={writeLog}
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
    </FirebaseProvider>
  )
}