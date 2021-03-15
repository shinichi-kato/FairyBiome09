import React, { useContext, useEffect, useState, useCallback } from 'react';
import { fade, makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import InputBase from '@material-ui/core/InputBase';
import SendIcon from '@material-ui/icons/Send';

import AppMenu from './AppMenu';
import FairyPanel from '../Panel/FairyPanel';
import UserPanel from '../Panel/UserPanel';

import { BotContext } from '../Bot/BotProvider';
import {FirebaseContext} from "../Firebase/FirebaseProvider";

import { EcosystemContext } from '../Ecosystem/EcosystemProvider';

import Dexie from "dexie";

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
    ユーザやecosystemからの入力をbotにわたし、
    botから得た返答を表示する。

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
  const [handleSubmit,setHandleSubmit] = useState();
  const [userInput, setUserInput] = useState("");

  useEffect(() => {
    if (!db && window !== undefined) {
      db = new Dexie('Log');
      db.version(1).stores({
        home: "++id,uid,timestamp",  // id,timestamp,uid,name,line...
        forest: "++id,uid,timestamp",// id,timestamp,uid,name,line...
      });
    }
  }, [db]);

  useEffect(() => {
    let cancelled = false;
    if (!cancelled) {
      bot.deploy(ecosystem.site).then(site => {
        switch (site) {
          case 'room':{

            // indexedDBにログを開始
            setHandleSubmit(()=>(event)=>handleLocalWrite(event));

            break;
          }

          case 'forest':{

            break;
          }

          case 'park':{

            break;
          }

          case false:{
            break;
          }
          
          default:
            throw new Error(`invalid site "${site}"`);
        }
      });
    }

    return (() => {
      cancelled = true;
    })

  }, [ecosystem.site]);

  function handleLocalWrite(event) {
    // formのユーザ入力をDBに書き込む
    db.home.add({ 
      name: fb.displayName,
      line: userInput,
      timestamp:new Date(),
      pressure:ecosystem.pressure,
      weather:ecosystem.weather,
      nightOrday:ecosystem.nightOrDay,
      site:ecosystem.site
    });
    setUserInput("");

    event.preventDefault();

    // botの入力はどうする？
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
                  inputProps={{'aria-label': 'text'}}
                />
              </div>
            </Box>
            <Box>
              <IconButton
                color="primary"
              >
                <SendIcon/>
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