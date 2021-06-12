import React, { useState } from "react";
import { graphql, navigate } from "gatsby"

import FirebaseProvider from '../components/Firebase/FirebaseProvider';
import BiomebotProvider from '../components/biomebot/BiomebotProvider';
import CreateFairy from '../components/CreateFairy/CreateFairy';

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
  */
  const [appState, setAppState] = useState('landing');

  const chatbots = data.allJson.nodes.map(node => ({
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

  console.log("appState", appState)
  return (
    <FirebaseProvider
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
    </FirebaseProvider>
  )
}

