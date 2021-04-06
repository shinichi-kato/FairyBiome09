import React, { useState} from "react";
import { graphql } from "gatsby"

import FirebaseProvider from '../components/Firebase/FirebaseProvider';
import BiomebotProvider from '../components/Biomebot/BiomebotProvider';
import CreateFairy from '../components/CreateFairy/CreateFairy';

export default function CreatePage({location, data}){
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
  const [appState, setAppState] = useState(
    location.search === '?select' ? 'select' : 'landing');

  const chatbots = data.allJson.nodes.map(node=>({
    name: node.main.NAME,
    creator: node.main.CREATOR_NAME,
    directory: node.parent.relativeDirectory,
    backgroundColor:node.config.backgroundColor,
    description: node.config.descrition
  }));

  function handleBotFound() { setAppState('continue'); }
  function handleBotNotFound() { setAppState('new'); }

  return (
    <FirebaseProvider>
      <BiomebotProvider
        appState={appState}
        handleBotNotFound={handleBotNotFound}
        handleBotFound={handleBotFound}
      >
        <CreateFairy 
          appState={appState}
          chatbots={chatbots}
        />
      </BiomebotProvider>
    </FirebaseProvider>
  )
}

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
