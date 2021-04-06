import React from "react";
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';

import FairyBiomeCrest from './fairybiome-crest.inline.svg';
import UserAccount from './UserAccount';

const useStyles= makeStyles(theme=>({
  crest:{
    width: "100%",
    padding: theme.spacing(1),
  },
  crestContainer: {
    width: "80%",
  },
  button:{
    fontSize: 18,
    padding:theme.spacing(2),
  }
}));

const STATE_TABLE = {
  'landing': 0,
  'authOk': 1,
  'new': 2,
  'continue': 3
};

export default function Landing(props){
  /* 
    アプリの状態がprops.appStateで渡されてくる。
    appState    表示要素
    --------------------------------------------------------
    'landing'   ロゴ
    'authOk'    ロゴ ユーザアカウント
    'new'       ロゴ ユーザアカウント はじめから
    'continue'  ロゴ ユーザアカウント はじめから チャットルームに入る
    ---------------------------------------------------------
    
  */
  const classes = useStyles();
  const appState = STATE_TABLE[props.appState]

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
    >
      <Box className={classes.crestContainer}>
        <FairyBiomeCrest
          className={classes.crest}
        />
      </Box>
      <Box>
        {appState > 0 && <UserAccount />}
      </Box>
      <Box>
        {appState > 1 && 
          <Button
            className={classes.button}
            onClick={props.handleNew}
          >
            はじめから
          </Button>
        }
      </Box>
      <Box>
        {appState > 2 && 
          <Button
          className={classes.button}
          onClick={props.handleContinue}
          >
            チャットルームに入る
          </Button>
        }
      </Box>
    </Box>
  )
}