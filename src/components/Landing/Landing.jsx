import React from "react";
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import EditIcon from '@material-ui/icons/EditOutlined';
import ChatIcon from '@material-ui/icons/ChatOutlined';

import FairyBiomeCrest from './fairybiome-crest.inline.svg';
import UserAccount from './UserAccount';
import { navigate } from 'gatsby';

const useStyles = makeStyles(theme => ({
  crest: {
    width: "100%",
    padding: theme.spacing(1),
  },
  crestContainer: {
    width: "80%",
  },
  buttonContainer: {
    padding: theme.spacing(2),
  },
  button: {
    fontSize: 18,
    padding: theme.spacing(1),
  }
}));

const STATE_TABLE = {
  'landing': 0,
  'authOk': 1,
  'new': 2,
  'continue': 3
};

export default function Landing(props) {
  /* 
    アプリの状態がprops.appStateで渡されてくる。
    appState    表示要素
    --------------------------------------------------------
    'landing'   ロゴ
    'authOk'    ロゴ ユーザアカウント
    'new'       ロゴ ユーザアカウント はじめから
    'continue'  ロゴ ユーザアカウント はじめから 編集 チャットルームに入る
    ---------------------------------------------------------
    
  */
  const classes = useStyles();
  const appState = STATE_TABLE[props.appState];

  function handleToEdit() {
    navigate("/edit");
  }

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

      <Box
        className={classes.buttonContainer}
        visibility={appState > 2 ? "visible" : "hidden"}
      >
        <Button
          className={classes.button}
          onClick={props.handleContinue}
          startIcon={<ChatIcon />}
          color="primary"
          variant="contained"
        >
          チャットを始める
        </Button>
      </Box>
      <Box
        className={classes.buttonContainer}
        visibility={appState > 2 ? "visible" : "hidden"}
      >
        <Button
          className={classes.button}
          startIcon={<EditIcon />}
          onClick={handleToEdit}>
          チャットボットのデータ編集
        </Button>
      </Box>
    </Box>
  )
}