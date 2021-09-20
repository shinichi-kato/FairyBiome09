import React, { useContext, useRef, useEffect, useState, useMemo } from 'react';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIos';

import UserPanel from '../Panel/UserPanel';
import FairyPanel from '../Panel/FairyPanel';
import LogViewer from './LogViewer';
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
  const writeLogRef = useRef(props.writeLog);
  const [userInput, setUserInput] = useState("");

  //---------------------------------------
  // チャットルームに入室したらdeploy
  //

  useEffect(() => {
    bot.current.deploy(ecosystem.site);
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

  const currentLog = props.logs[ecosystem.site];

  const memorizedLogViewer = useMemo(() =>
    <LogViewer
      log={currentLog}
    />
    , [currentLog]);

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
      >
        <Box>
          <IconButton>
            <ArrowBackIcon />
          </IconButton>
        </Box>
        <Box flexGrow={1}>
          <form onSubmit={handleUserSubmit}>
            <div sx={{
              position: 'relative',
              borderRadius: "50vh",
              backgroundColor: theme => alpha(theme.palette.common.white, 0.15),
              '&:hover': {
                backgroundColor: theme => alpha(theme.palette.common.white, 0.25),
              },
              marginRight: theme => theme.spacing(2),
              marginLeft: 0,
              width: 400,
            }}>
              <InputBase
                sx={{
                  padding: (theme) => theme.spacing(1),
                  // vertical padding + font size from searchIcon
                  pladdingLeft: '1em',
                  width: '100%',
                  color: '#000000',
                }}
                value={userInput}
                onChange={handleChangeUserInput}
                fullWidth
                inputProps={{ 'aria-label': 'text' }}
                endAdornment={
                  <IconButton
                    color="primary"
                    onClick={handleUserSubmit}
                  >
                    <SendIcon />
                  </IconButton>
                }
              />
            </div>
          </form>
        </Box>
      </Box>
    </Box>
  )
}