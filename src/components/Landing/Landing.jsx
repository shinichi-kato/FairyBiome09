import React, {useContext} from "react";
import loadable from '@loadable/component';
import {BotContext} from "../Biomebot/BotProvider";
import TitlePage from './TitlePage';
const CreateFairy = loadable(() => import('../Biomebot/CreateFairy'));

export default function Landing(props){
  /* 
    アプリの状態がprops.stateで渡されてくる。
    botの初期化が終了するまではtitlepageを表示し、
    その後props.stateに従った表示を行う。
    
  */
  const bot = useContext(BotContext);
  
  return (
    <div>
      { bot.id === null 
        ? 
        <TitlePage/>
        :
        (props.state === "create" ?
          <CreateFairy />
          :
            (props.state === "title" 
            ?
            <TitlePage 
              showMenu
              toMainPage={props.toMainPage}
              withContinue={bot.id !== ""}/>
            :
            props.children 
            )        
          )
      }
    </div>
  )
}