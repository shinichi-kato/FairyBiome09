import React, { useContext, useState, useEffect } from "react";
import { navigate } from "gatsby";
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';



// import InputAdornment from '@mui/material/InputAdornment';
// import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import { BiomebotContext } from '../biomebot/BiomebotProvider';
import { AuthContext } from "../Auth/AuthProvider";
import { firestore } from '../../firebase';
import {
  query, collection, where, orderBy, limit, onSnapshot, getDoc
} from 'firebase/firestore';
import ContinueStep from "./ContinueStep";
import SelectStep from "./SelectStep";
import SettingsStep from "./SettingsStep";


const STATE_TABLE = {
  'new': 0,
  'landing': 1,
  'authOk': 2,
  'continue': 3,
  'exec': 4,
  'select': 5,
  'settings': 6,
  'done': 7
};

export default function CreateFairy(props) {
  /* 
    チャットボットを既存データから読み込む。
    読み込むデータは/static/chatbotのうちbotIdの付与されていないデータ、
    またはfirestore上でuserが保存したものである。/static/chatbotの情報は
    props経由で取得し、fs上のデータはこのコンポーネントで購読する。

    botはlocationとidの組み合わせ特定され、locationはcloudまたはstaticで
    cloudの場合はidはbotIdとなる。staticの場合はidがフォルダ名となる。



    チャットボットを新規作成したときに名前と背景色を設定する。
    ※これから実装

    アプリの状態がappStateで渡されてくる。
    appState        表示要素
    ---------------------------------------------------------
    'new'           プロローグにnavigate
    'landing'       タイトル
    'authOk'        タイトル ユーザアカウント
    'continue'      タイトル ユーザアカウント 上書き確認メッセージ
    'exec'          タイトル ユーザアカウント チャットボット選択画面
    'settings'      タイトル ユーザアカウント 名前と背景色設定
    'done'          タイトル ユーザアカウント 戻るボタン

    このページを表示するurlへの直リンクの場合/へ転送
    
    props.chatbots = [
      {   name: string,
          creator: string,
          directory: string,
          backgroundColor:string,
          description: string,}
    ]
  */
  const auth = useContext(AuthContext);
  const bot = useContext(BiomebotContext);
  const appState = STATE_TABLE[props.appState];

  const [fsChatbots, setFsChatbots] = useState(props.chatbots);
  const [botIdentifier, setBotIdentifier] = useState(
    {location:null,botId:null,avatarPath:null}
  );
  const [botName,setBotName] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('');

  const appStateByName = props.appState;

  // --------------------------------------------------------
  // firestoreに格納されたボットの検索
  // そのサブスクリプションを開始

  useEffect(() => {
    let unsubscribe = null;

    if (auth.uid) {
      const botsRef = collection(firestore, "bots");
      const q = query(botsRef,
        where("config.ownerId", "==", auth.uid),
        orderBy("timestamp"),
        limit(5));

      unsubscribe = onSnapshot(q, (snap) => {
        let arr = [];
        snap.forEach((doc) => {
          const d = doc.data();
          arr.push({
            location: 'cloud',
            id: doc.id,
            name: d.main.NAME,
            creator: d.main.CREATOR_NAME,
            directory: d.config.avatarPath,
            backgroundColor: d.config.backgroundColor,
            description: d.config.description,
          })
        });
        setFsChatbots([...props.chatbots, arr]);
      })
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    }
  }, [auth.uid, props.chatbots])

  function handleAccept() {
    navigate('/content/prologue1/');
  }

  function handleSelectBot(location, id, avatarPath) {
    setBotIdentifier({location:location, id:id, avatarPath:avatarPath});
  }

  function handleChangeBotName(n){
    setBotName(n);
  }

  function handleChangeBackgroundColor(c){
    setBackgroundColor(c);
  }

  function handleGenerate() {
    const {location,botId}=botIdentifier;
    (async ()=>{
      if (location === 'cloud'){
        // firestoreから読み込み
        const docRef = doc(firestore, "bots", botId);
        const docSnap = await getDoc(docRef);
        const obj = docSnap.data();

        // partsの読み込み
        for(let partName of Object.keys(obj.parts)){
          // saveもloadも未実装
        }

      } else if (location === 'static'){
        // staticフォルダから読み込み
        const res = await fetch(`../../chatbot/${id}/chatbot.json`);
        const obj = await res.json();
        await bot.generate(boj,id);
        props.handleDone();
      }
  
    })();
  }

  function handleReturn() {
    navigate('/');
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            新しい妖精
          </Typography>
          {appState > 0 &&
            <IconButton
              onClick={auth.openUpdateDialog}
            >
              <Avatar
                aria-label="user"
                src={`../../avatar/${auth.photoURL}`} alt={auth.photoURL} />
            </IconButton>
          }

        </Toolbar>
      </AppBar>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        sx={{ paddingTop: "3em", }}
      >
        {appStateByName === 'continue' &&
          <ContinueStep
            displayName={bot.displayName}
            handleAccept={handleAccept}
            handleReturn={handleReturn}
          />
        }
        {appStateByName === 'exec' &&
          <SelectStep
            fsChatbots={fsChatbots}
            handleSelectBot={handleSelectBot}
            botIdentifier={botIdentifier}
            handleNext={() => props.handleMove('settings')}
          />
        }
        {
          appStateByName === 'settings' &&
          <SettingsStep
            botIdentifier={botIdentifier}
            botName={botName}
            handleChangeBotName={handleChangeBotName}
            defaultColor={'#dddddd'}
            color={backgroundColor}
            handleChangeColor={handleChangeBackgroundColor}
            handleGenerate={handleGenerate}
            handlePrev={()=>props.handleMove('exec')}
          />
        }
        {appStateByName === 'done' &&
          <>
            <Box>
              {bot.state.displayName} が仲間になりました
            </Box>
            <Box>
              <Button
                variant="contained"
                onClick={handleReturn}>
                戻る
              </Button>
            </Box>
          </>
        }
      </Box>
    </>

  )
}