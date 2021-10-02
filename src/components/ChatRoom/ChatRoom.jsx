import React, { useContext, useRef, useEffect, useState, useMemo } from 'react';
import { alpha } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import SendIcon from '@mui/icons-material/Send';

import UserPanel from '../Panel/UserPanel';
import FairyPanel from '../Panel/FairyPanel';
import LogViewer from './LogViewer';
import AppMenu from './AppMenu';
import { BiomebotContext } from '../biomebot/BiomebotProvider';
import { FirebaseContext } from "../Firebase/FirebaseProvider";
import { EcosystemContext } from '../Ecosystem/EcosystemProvider';
import { Message } from '../message';




export default function ChatRoom(props) {
  /*
    チャットルーム
    ===============

  */
  const fb = useContext(FirebaseContext);
  const ecosystem = useContext(EcosystemContext);
  const bot = useRef(useContext(BiomebotContext));
  const writeLogRef = useRef();
  const logRef = useRef();
  const [userInput, setUserInput] = useState("");

  function handleChangeSite(site){
    ecosystem.changeSite(site);
  }

  //---------------------------------------
  // チャットルームに入室したらdeploy
  //
  
  useEffect(() => {
    const site = ecosystem.site;
    bot.current.deploy(site);

    if(site === 'park'){
      writeLogRef.current = fb.writeLog;
      logRef.current = fb.parkLog;
    }else{
      writeLogRef.current = props.writeLog;
      logRef.current = props.logs[ecosystem.site];
    }
  }, [ecosystem.site]);

  // ---------------------------------------------
  // ecosystemが変化したらチャットボットにトリガーを送出
  // bot.deploy()が完了するまで保留される

  useEffect(() => {

    if (ecosystem.change !== null) {
      bot.current.execute(
        new Message('trigger', `{enter_${ecosystem.change}}`),
        writeLogRef.current
      );
      ecosystem.changeDispatched();
    }
  }, [ecosystem]);



  function handleChangeUserInput(event) {
    setUserInput(event.target.value);
  }

  function handleUserSubmit(event) {
    writeLogRef.current(new Message('speech', {
      text: userInput,
      name: fb.displayName,
      person: 'user',
      mood: 'peace',
      avatarPath: fb.photoURL,
      site: ecosystem.site,
    }));

    // 後でtextの中身を直接いじるので同一内容のMessageを新たに作って渡す
    bot.current.execute(new Message('speech', {
      text: userInput,
      name: fb.displayName,
      person: 'user',
      mood: 'peace',
      avatarPath: fb.photoURL,
      site: ecosystem.site,
    }), writeLogRef.current);

    setUserInput("");
    event.preventDefault();
  }



  const memorizedLogViewer = useMemo(() =>
    <LogViewer
      log={logRef.current}
    />
    , [logRef]);

  const memorizedUserPanel = useMemo(() =>
    <UserPanel user={fb} />
    , [fb]);

  return (
    <Box
      display="flex"
      sx={{
        width: 480,
        height: "100vh"
        // 子がflexGrowを使うコンポーネントは高さを指定
      }}
      flexDirection="column"
      position="relative"
    >
      <Box
        sx={{
          height: "calc ( 100vh - 48px - 256px)",
          overflowY: "scroll"
        }}
        flexGrow={1}
      >
        {memorizedLogViewer}
      </Box>

      <Box
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        sx={{
          width: 480
        }}
      >
        <Box>
          <FairyPanel
            photoURL={bot.current.photoURL}
          />
        </Box>
        <Box>
          {memorizedUserPanel}
        </Box>

      </Box>
      <Box
        position="absolute"
        bottom={0}
        display="flex"
        flexDirection="row"
        sx={{ width: "100%" }}
      >
        <Paper
          sx={{
            display: "flex",
            alignItems: "center",
            width: "calc( 100% - 4px)",
            p: '2px 4px',
            m: '4px',
            borderRadius: '10px',
            flexGrow: 1,
            backgroundColor: alpha('#ffffff', 0.2)
          }}
          component="form"
          onSubmit={handleUserSubmit}
          elevation={0}
        >
          <AppMenu
            site={ecosystem.site}
            handleExitRoom={props.handleExitRoom}
            handleChangeSite={handleChangeSite}
          />
          <InputBase
            sx={{
              ml: 1,
              flex: 1,
            }}
            value={userInput}
            onChange={handleChangeUserInput}
            fullWidth
            inputProps={{ 'aria-label': 'text' }}
            endAdornment={
              <IconButton
                onClick={handleUserSubmit}
                color="primary"
              >
                <SendIcon />
              </IconButton>
            }
          />
        </Paper>
      </Box>
    </Box >
  )
}