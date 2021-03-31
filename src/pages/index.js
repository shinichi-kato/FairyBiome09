import React, {useState, useEffect} from "react";
import { useStaticQuery, graphql } from "gatsby";

import FirebaseProvider from "../components/Firebase/FirebaseProvider";
import EcosystemProvider from '../components/Ecosystem/EcosystemProvider';
import BotProvider from "../components/Bot/BotProvider";
import Landing from "../components/Landing/Landing";
import Main from '../components/Main/Main';


const query = graphql`
query indexq {
  site {
    siteMetadata {
      chatbot {
        logViewLength
        logStoreLength
      }
    }
  }
}
`

export default function Index({ location }) {
  /*
    アプリの基本構造。

    state
    ---------------------------------------------------------------
    "continue"      indexedDBからのロードを試み、成功したらMainに引き継ぐ。
                    失敗したら"title"に移行
    "title"         title表示。「はじめから」、「つづき」を選択。それぞれ
                    選択されたらプロローグページ or continueに移行
    "main"          Mainへ

    "create"        プロローグページから戻ってくる場合にcreateが指定される。
                    botの新規作成に 移行

    firestoreの初期

  */
  const data = useStaticQuery(query);
  const config = data.site.siteMetadata.chatbot;
  const [state, setState] = useState(
    location.search === "?create" ? "create" : "title");

  useEffect(()=>{
    setState(location.search === "?create" ? "create" : "title");
  },[location.search]);
  
  function handleToTitlePage() {
    setState("title");
  }

  function handleToMainPage() {
    setState("main")
  }

  return (
    <FirebaseProvider>
      <BotProvider
        toMainPage={handleToMainPage}
      >
        <Landing
          toTitlePage={handleToTitlePage}
          toMainPage={handleToMainPage}
          state={state}
        >
          <EcosystemProvider>
            <Main 
              toTitlePage={handleToTitlePage}
              config={config}
            />
          </EcosystemProvider>
        </Landing>
      </BotProvider>
    </FirebaseProvider>
  )
}