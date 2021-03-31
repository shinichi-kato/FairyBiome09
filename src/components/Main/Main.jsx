import React, { useContext, useEffect, useState } from 'react';
import { fade, makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import InputBase from '@material-ui/core/InputBase';
import SendIcon from '@material-ui/icons/Send';

import AppMenu from './AppMenu';
import FairyPanel from '../Panel/FairyPanel';
import UserPanel from '../Panel/UserPanel';

import { BotContext } from '../Bot/BotProvider';
import { FirebaseContext } from "../Firebase/FirebaseProvider";
import { EcosystemContext } from '../Ecosystem/EcosystemProvider';
import { LogViewer } from "./LogViewer";
import { Message } from "../../biomebot/message";
import Dexie from "dexie";
import { InfoSharp } from '@material-ui/icons';

var undefined;
let db = null;



const useStyles = makeStyles(theme => ({
  root: {
    '& .MuiTextField-root': {
      '& fieldset': {
        borderRadius: '50vh',
      },
      margin: theme.spacing(1),
      width: 350,
      fontSize: 18,
      backgroundColor: '#f0f0f0',
      borderRadius: '50vh',

    },
  },
  rootWhoseChildUsesFlexGrow: {
    width: "100%",
    height: "100vh",
  },
  icon: {
    width: 120, // 24*x
    height: 140  // 28*x
  },
  main: {
    paddingTop: 200,
  },
  mainView: {
    height: "calc ( 100vh - 48px - 256px);",
    overflowY: "scroll",
  },
  textInput: {
    position: 'relative',
    borderRadius: "50vh",
    backgroundColor: fade(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
  },
  inputRoot: {
    color: 'inherit',
  },
  inputInput: {
    padding: theme.spacing(1),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },


}));

export default function Main(props) {
  /* 
    チャットボットのメイン画面
    現在の場所(森、家、公園）はEcosystemから供給される。
    ユーザやecosystemからの入力をbotに渡し、
    botから得た返答を表示する。
    
    props.config.logViewLengthで表示されるlogの長さ、
    props.config.logStoreLengthでdb.logに保持されるlogの長さを指定する。

    家ではユーザとユーザの妖精が1:1で会話する。
    森では森にいる妖精に声をかけたりランダムに出会い、会話する。
    tutorの妖精は必ず森にいる
    公園ではユーザとユーザの妖精がグループのチャットに発言を投稿する.

    家と森ではログにindexedDBを用い、公園ではfirestoreを用いる。
    firestoreのリスナーは常時起動しておき、他人の入力があったら
    （妖精が？）ユーザに通知する。

  */

  const classes = useStyles();
  const bot = useContext(BotContext);
  const fb = useContext(FirebaseContext);
  const ecosystem = useContext(EcosystemContext);
  const [handleSubmit, setHandleSubmit] = useState();
  const [userInput, setUserInput] = useState("");
  const [busy, setBusy] = useState();
  const [log, setLog] = useState([]);

  const {logViewLength,logStoreLength} = props.config;

  useEffect(() => {
    if (!db && window !== undefined) {
      db = new Dexie('Log');
      db.version(1).stores({
        home: "++id,uid,timestamp",  // id,timestamp,uid,name,text...
        forest: "++id,uid,timestamp",// id,timestamp,uid,name,text...
      });
    }
  }, [db]);

  useEffect(() => {
    let cancelled = false;
    if (!cancelled) {
      bot.deploy(ecosystem.site).then(() => {
        switch (ecosystem.site) {
          case 'room': {

            // indexedDBにログを開始
            setHandleSubmit(() => (event) => handleLocalWrite(event));

            // botからの出力を受けるリスナーはonEffect()
            break;
          }

          case 'forest': {

            break;
          }

          case 'park': {

            break;
          }

          case false: {
            break;
          }

          default:
            throw new Error(`invalid site "${ecosystem.site}"`);
        }
      });
    }


    return (() => {
      cancelled = true;
    })

  }, [ecosystem.site]);

  useEffect(() => {
    // チャットボットからの発言をlistenしてログに書き込む
    (async () => {
      const message = bot.output.message;
      if (message !== null) {

        await db.home.add({
          text: message.text,
          name: message.name,
          person: message.person,
          site: message.site,
          timestamp: message.timestamp
        });
        writeLog(message);
      }
    })();
  }, [bot.output]);

  function handleLocalWrite(event) {
    // formのユーザ入力をDBに書き込む
    if (!busy) {
      setBusy(true);
      const input = new Message("speech", {
        text: userInput,
        name: fb.displayName,
        person: 'user',
        ecosystem: {
          weather: ecosystem.weather,
          nightOrday: ecosystem.nightOrDay,
        },
        site: ecosystem.site
      });
      setUserInput("");

      (async () => {
        await db.home.add({
          text: input.text,
          name: input.name,
          person: input.person,
          site: input.site,
          timestamp: input.timestamp
        });
        // ここでレンダリング
        await bot.reply(input);
      })();
      setBusy(false);
    }

    event.preventDefault();
  }

  function writeLog(message){
    /*  ログにmessageを書き込む。
        表示するログはlogに格納され最大長がprops.config.logViewLengthで定義される。
        必要に応じてtruncateする。
        同時にログはdb.logに保存される。ログの内容はチャットボットの学習にも
        使われ、長さはprops.config.logStoreLengthで定義される。

        チャットボットにはmoodがあり

    */
    setLog(prev=>{
      prev.push(message);
      if(prev.length > logViewLength){
        prev.slice(0,logViewLength);
      }
      return prev;
    });

  }

  function handleChangeUserInput(event) {
    setUserInput(event.target.value);
  }

  return (
    <Box
      display="flex"
      className={classes.rootWhoseChildUsesFlexGrow}
      flexDirection="column"
      position="relative"
    >
      <Box
        className={classes.mainView}
        flexGrow={1}
      >
        <LogViewer
          log={log}
          
        />
      </Box>
      <Box>
        <form onSubmit={handleSubmit}>
          <Box
            display="flex"
            flexDirection="row"
          > 
            <Box
              flexGrow={1}
            >
              <div className={classes.textInput}>
                <InputBase
                  value={userInput}
                  onChange={handleChangeUserInput}
                  fullWidth
                  classes={{
                    root: classes.inputRoot,
                    input: classes.inputInput,
                  }}
                  inputProps={{ 'aria-label': 'text' }}
                />
              </div>
            </Box>
            <Box>
              <IconButton
                color="primary"
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>

        </form>
      </Box>
      <Box
        display="flex"
        flexDirection="row"
        justify="space-between"
      >
        <Box>
          <FairyPanel />
        </Box>
        <Box>
          <UserPanel />
        </Box>

      </Box>
      <Box
        position="absolute"
        top={0}
        left="50%"
      >
        <AppMenu
          toTitlePage={props.toTitlePage}
        />
      </Box>
    </Box>
  );
}