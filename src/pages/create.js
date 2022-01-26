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
            mtime
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

const appStateByNumber = {
  'landing': 0,
  'authOk': 1,
  'new': 2,
  'continue': 3,
  'exec': 4,
  'settings': 5,
  'done': 6
};

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
    'continue'      既存チャットボット上書き確認の後ストーリー画面へ遷移    
    'exec'          ストーリー表示画面からの遷移。チャットボット選択
    'setting'       名前と背景色を設定
    'done'          完了確認

    ■チャットボットのロード
    チャットボットは/staticとfirestoreからロードできる。
    またdata.site.siteMetadata.chatbot.allowUserOwnSystemBotが有効なら
    /staticのうちidの末尾が@systemになっているものをユーザ用に（uidを与えて)
    ロードできる。

    
  */
  const [appState, setAppState] = useState('landing');

  // staticのチャットボット情報を取得。locationを'static'とすることで
  // firestore上のデータと区別する。この情報はbotのデータを識別するためだけに
  // 使用し、そのためbotIdにはディレクトリ名を用いる。
  const chatbots = data.allJson.nodes.map(node => ({
    location: 'static',
    name: node.main.NAME,
    id: node.parent.relativeDirectory,
    creator: node.main.CREATOR_NAME,
    directory: node.parent.relativeDirectory,
    backgroundColor: node.config.backgroundColor,
    description: node.config.description,
    timestamp:new Date(node.parent.mtime),
  }));


 
  if (location.search === '?exec' && appStateByNumber[appState] < 4) {
    setAppState('exec');
  }
  console.log("state",appState)
  function handleBotFound() { setAppState('continue'); }
  function handleAuthOk() { setAppState('authOk'); }
  function handleBotNotFound() {
    setAppState('new');
    navigate('/content/prologue1/');
  }
  function handleMove(state) { setAppState(state) }

  useEffect(()=>{

    if(!firebaseApp){
      initializeFirebaseApp();
      
    }
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
          handleMove={handleMove}
          chatbots={chatbots}
        />
      </BiomebotProvider>
    </AuthProvider>
  )
}

