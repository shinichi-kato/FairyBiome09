import React, { useEffect, useContext } from "react";
import { navigate } from 'gatsby';
import FirebaseProvider from "../components/Firebase/FirebaseProvider";
import BotProvider from "../components/Biomebot/BotProvider";
import TitlePage from '../components/Landing/TitlePage';
import Editor from '../components/Editor/Editor';


export default function EditorPage({ location }) {
  /*
   * bot.idがnullの場合、まだbotの読み込みが終わっていない→TitlePage表示
   * bot.idが空文字列→編集可能なボットが生成されていない
   * bot.idが文字列→編集へ 
   * 

   */

  const bot = useContext(BotProvider);
  function handleToMainPage() {
    
  }

  return (
    <FirebaseProvider>
      <BotProvider
        toMainPage={handleToMainPage}
      >
        <>
          {bot.id === null
            ?
            <TitlePage />
            :
            (bot.id === ""
              ?
              <NoBots />
              :
              <Editor />
            )
          }
        </>
      </BotProvider>
    </FirebaseProvider>
  )
}

function NoBots(){
  useEffect(()=>{
    navigate('/content/no-bot/')
  })
  return (<div></div>);
}