import React, { useState, useContext, createContext, useEffect } from 'react';

import Biomebot from '../../biomebot/biomebot';

import { FirebaseContext } from "../Firebase/FirebaseProvider";


export const BotContext = createContext(Biomebot);
const bot = new Biomebot();

const initialState = {
  botId: null,
  config: {
    botDir: "",
    description: "",
    initialMentalLevel: 10,
    startPartOrder: [],
    hubBehavior: {
      momentUpper: 10,
      momentLower: 0,
      precision: 0.5,
      retention: 0.4,
    },
  },
  state: {
    updatedAt: new Date(1970, 1, 1),
    partOrder: [],
    mentalLevel: 10,
    moment: 0,
    mood: "peace",
    queue: [],
    timerPostings: []
  }
}

export default function BiomebotProvider(props) {
  const [botId, setBotId] = useState(initialState.botId);
  const [config, setConfig] = useState(initialState.config);
  const [state, setState] = useState(initialState.state);
  const [displayNameCache, setDisplayNameCache] = useState("");
  const [output, setOutput] = useState({key:0,message:null});
  const fb = useContext(FirebaseContext);



  function setObj(data) {
    setBotId(data.botId);
    setConfig(data.config);
    setState(data.state);
    setDisplayNameCache(data.displayNameCache);
  }

  useEffect(() => {
    let isCancelled = false;
    /*
      navigate('/')で実行された場合はbotに接続できたらMainPageへ移動するが、
      navigate('/?create')の場合はbotに接続できたら<CreateFairy/>に移動する
      移動先の制御はBotProviderではなくLanding側にするほうがいい

    */
    console.log("botprovider:uid",fb.uid)
    if (fb.firestore && fb.uid) {

      (async () => {
        const data = await bot.connect(fb.firestore, fb.uid, fb.uid);
        if(!isCancelled){
          setBotId(data.botId);
          if (data.botId !== "") {
            setObj(data);
            props.toMainPage();
          }
        }
      })();

    }

    return () => { isCancelled = true };

  }, [fb.firestore, fb.uid]);

  function handleRename(displayName) {
    bot.rename(displayName);
    setDisplayNameCache(displayName);
  }

  function handleGenerate(obj, dir) {
    bot.generate(obj, dir)
      .then(data=> setObj(data));
  }

  function handleDeploy(site) {
    // bot.deploy returns Promise
    return bot.deploy(site);
  }

  function handleReply(inMessage) {
    /* inSpeech {
      text: 入力文字列
      name: 発言者名
      person: 発言者('chatbot'|'buddy'|'friend'|'other')
      trigger: 環境の変化
      }
    */
    bot.reply(inMessage).then(outMessage=>{
      setOutput(prev=>({
        key:prev.key + 1,
        message: outMessage,
      }))
    })
  }

  return (
    <BotContext.Provider
      value={{
        id: botId,
        displayName: displayNameCache,
        avatarPath: config.botDir,
        rename: handleRename,
        generate: handleGenerate,
        deploy: handleDeploy,
        reply: handleReply,
        mood: bot.state.mood,
        output: output,
      }}
    >
      { props.children }

    </BotContext.Provider>
  )
}

