import React, { useContext, useEffect, useState, useMemo } from 'react';
import { fade, makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import InputBase from '@material-ui/core/InputBase';
import SendIcon from '@material-ui/icons/Send';

import UserPanel from '../Panel/UserPanel';
import FairyPanel from '../Panel/FairyPanel';
import LogViewer from './LogViewer';
import { BiomebotContext } from '../Biomebot/BiomebotProvider';
import { FirebaseContext } from "../Firebase/FirebaseProvider";
import { EcosystemContext } from '../Ecosystem/EcosystemProvider';
import { Message } from '../message';

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
    color: '#FFFFFFCC',
  },
  inputInput: {
    padding: theme.spacing(1),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    width: '100%',
  },


}));

export default function ChatRoom(props) {
  /*
    チャットルーム
    ===============

  */
  const classes = useStyles();
  const fb = useContext(FirebaseContext);
  const ecosystem = useContext(EcosystemContext);
  const bot = useContext(BiomebotContext);
  const [userInput, setUserInput] = useState("");

  useEffect(()=>{
    bot.deploy(ecosystem.site);
  },[bot, ecosystem.site]);

  function handleChangeUserInput(event) {
    setUserInput(event.target.value);
  }

  function handleSubmit(event) {
    const message = new Message('speech', {
      text: userInput,
      name: fb.displayName,
      person: 'user',
      mood: '',
      avatarPath: fb.photoURL,
      site: ecosystem.site,
    });
    console.log("submit",message)
    props.writeLog(message);
    bot.recieve(message);

    setUserInput("");
    event.preventDefault();
  }
  const currentLog = props.logs[ecosystem.site];

  const memorizedLogViewer = useMemo(()=>
    <LogViewer
    log={currentLog}
    />
  ,[currentLog]);

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
        {memorizedLogViewer}
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
        bottom={0}
      >
        <form onSubmit={handleSubmit}>
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
              endAdornment={
                <IconButton
                  color="primary"
                  onClick={handleSubmit}
                >
                  <SendIcon/>
                </IconButton>
              }
            />
          </div>
        </form>
      </Box>
    </Box>
  )
}