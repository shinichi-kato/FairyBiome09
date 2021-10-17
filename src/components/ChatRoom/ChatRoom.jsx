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
import { AuthContext } from "../Auth/AuthProvider";
import { EcosystemContext } from '../Ecosystem/EcosystemProvider';
import { Message } from '../message';

import useLocalStorage from '../use-localstorage';

const panelWidth=[120, 160, 192];


export default function ChatRoom(props) {
  /*
    チャットルーム
    ===============

  */
  const auth = useContext(AuthContext);
  const ecosystem = useContext(EcosystemContext);
  const bot = useRef(useContext(BiomebotContext));
  const [userInput, setUserInput] = useState("");
  const [panelSize, setPanelSize] = useLocalStorage("panelSize", 1);

  function handleChangeSite(site) {
    ecosystem.changeSite(site);
  }

  //---------------------------------------
  // チャットルームに入室したらdeploy
  //

  const writeLogRef = useRef(props.writeLog);

  useEffect(() => {
    let isCancelled = false;
    if (!isCancelled) {
      const site = ecosystem.site;
      bot.current.deploy(site);
    }

    return (() => { isCancelled = true; })

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
    props.writeLog(new Message('speech', {
      text: userInput,
      name: auth.displayName,
      person: 'user',
      mood: 'peace',
      avatarPath: auth.photoURL,
      site: ecosystem.site,
    }));

    // 後でtextの中身を直接いじるので同一内容のMessageを新たに作って渡す
    bot.current.execute(new Message('speech', {
      text: userInput,
      name: auth.displayName,
      person: 'user',
      mood: 'peace',
      avatarPath: auth.photoURL,
      site: ecosystem.site,
    }), props.writeLog);

    setUserInput("");
    event.preventDefault();
  }

  function handleChangePanelSize(size) {
    setPanelSize(prev=>{
      let newSize = prev + size;
      newSize = newSize<0 ? 0 : newSize;
      newSize = newSize<panelWidth.length ? newSize : panelWidth.length-1;
      return newSize; 
    });
  }

  const memorizedLogViewer = useMemo(() => {
    let log;
    switch (ecosystem.site) {
      case 'room':
        log = props.roomLog;
        break;
      case 'park':
        log = props.parkLog;
        break;
      case 'forest':
        log = props.forestLog;
        break;
      default:
        throw new Error(`invalid site ${ecosystem.site}`)
    }
    return (
      <LogViewer log={log} />
    )
  }
    , [props.forestLog, props.parkLog, props.roomLog, ecosystem.site]);

  const memorizedUserPanel = useMemo(() =>
    <UserPanel
      panelWidth={panelWidth[panelSize]}
      user={auth}
    />
    , [auth, panelSize]);

  return (
    <Box
      display="flex"
      sx={{
        width: "100%",
        height: "100vh",
        padding: "0px",
        // 子がflexGrowを使うコンポーネントは高さを指定
      }}
      flexDirection="column"
      position="relative"
    >
      <Box
        sx={{
          height: "calc ( 100vh - 48px - 256px)",
          overflowY: "scroll",
          alignItems: 'flex-end',
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
          width: "100%",
        }}
      >
        <Box>
          <FairyPanel
            panelWidth={panelWidth[panelSize]}
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
            handleChangePanelSize={handleChangePanelSize}
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