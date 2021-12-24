import React, { useState, useEffect } from "react";
import { graphql, navigate } from "gatsby"

import AuthProvider from '../components/Auth/AuthProvider';
import BiomebotProvider from '../components/biomebot/BiomebotProvider';
import CreateFairy from '../components/CreateFairy/CreateFairy';
import { initializeFirebaseApp, firebaseApp, firestore } from '../firebase';

export const query = graphql`
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
    site {
      siteMetadata {
        chatbot {
          allowUserOwnSystemBot
        }
      }
    }
  }
`

export default function CreatePage({ location, data }) {
  /* 
    チャットボット新規作成ページ 
  
    アプリ基幹部分の状態遷移を管理

    appState
    ---------------------------------------------------------
    'landing'       起動時はlanding状態。
    'authOk'        firebaseのauthが完了するとauthOkになり、ローカルの
                    チャットボットを探す。
    'new'           チャットボットが見つからない場合、新規作成
    'continue'      既存チャットボットがある場合、上書き    
    'exec'        プロローグページで「チャットボットを作る」をクリックした
    'done'        チャットボットが選択され、名前と背景色を設定

    ■チャットボットのロード
    チャットボットは/staticとfirestoreからロードできる。
    またdata.site.siteMetadata.chatbot.allowUserOwnSystemBotが有効なら
    /staticのうちidの末尾が@systemになっているものをユーザ用に（uidを与えて)
    ロードできる。

    
  */
  const [appState, setAppState] = useState('landing');

  // firestoreからチャットボットを読み込み/staticと混ぜるあたりを実装
  // locationにstaticまたはserverの文字列を入れて区別
  const chatbots = data.allJson.nodes.map(node => ({
    location: 'static',
    name: node.main.NAME,
    creator: node.main.CREATOR_NAME,
    directory: node.parent.relativeDirectory,
    backgroundColor: node.config.backgroundColor,
    description: node.config.description
  }));

  if (location.search === '?exec' && appState !== 'done' && appState !== 'exec') {
    setAppState('exec');
  }

  function handleBotFound() { setAppState('continue'); }
  function handleAuthOk() { setAppState('authOk'); }
  function handleBotNotFound() {
    setAppState('new');
    navigate('/content/prologue1/');
  }

  function handleDone() { setAppState('done') }

  useEffect(()=>{
    let isCancelled = false;

    if(!firebaseApp && !firestore && !isCancelled){
      initializeFirebaseApp();
      
    }

    return (()=>{ 
      isCancelled = true;
    });
  }, []);

  return (
    <AuthProvider
      firebase={firebaseApp}
      firestore={firestore}
      handleAuthOk={handleAuthOk}
    >
      <BiomebotProvider
        appState={appState}
        handleBotNotFound={handleBotNotFound}
        handleBotFound={handleBotFound}
      >
        <CreateFairy
          appState={appState}
          handleDone={handleDone}
          chatbots={chatbots}
        />
      </BiomebotProvider>
    </AuthProvider>
  )
}

