/*
  チャットルーム
  
  ユーザは部屋、公園、森という３つの場面を行き来できる。
  部屋ではユーザが今所有しているチャットボット（妖精）と会話できる。
  公園では他のユーザおよびチャットボットが会話に参加する。
  
  森に入ると、ユーザが所有するチャットボットの情報が自動的にサーバに保存される。
  ユーザ
  チューター役のチャットボットと会話ができ、チャットボットの
  育て方や付き合い方を聞くことができる。またユーザが森に入るとチャットボットの
  状態が自動でサーバーに保存される。サーバーに保存されたいずれかの
  チャットボットと会話できる。


*/

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

import { Noise } from 'noisejs';

const panelWidth = [120, 160, 192];
const TUTOR_ID = 'tutor@system';


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
  const writeLogRef = useRef(props.writeLog);
  const config = props.config;
  const noiseRef = useRef(new Noise(config.randomSeed));

  function getRandom(changeRate) {
    let timestamp = new Date();
    return (noiseRef.current.simplex2(changeRate * timestamp.getTime(),
      0) + 1) * 0.5; // simplex2は-1〜+1の値を取る。それを0~1に換算
  }


  function handleChangeSite(site) {
    ecosystem.changeSite(site);
  }

  //---------------------------------------
  // チャットルームに入室したらdeploy
  // forestに入った場合、ローカルのtimestampのほうがサーバーよりも新しく、
  // かつ24h以内に保存されていなければ自動でローカルのチャットボットのデータを
  // サーバーに保存する。props.configで定義した確率でチャットボットが出現
  //


  useEffect(() => {
    const site = ecosystem.site;

    if (site === 'forest') {
      const feConfig = config.forestEncounter;

      (async () => {
        // 自動セーブ


        const dice = getRandom(feConfig.changeRate);
        if (dice >= feConfig.tutor) {
          // コードからチューターをロード
          const res = await fetch(`../../chatbot/${TUTOR_ID}/chatbot.json`);
          const obj = await res.json();
          await bot.current.generate(obj, TUTOR_ID);

        }
        else if (dice >= feConfig.usersFairy) {
          // サーバーからランダムに選んだfairyをロード
        }

        await bot.current.deploy(site);
      })()

    } else {
      bot.current.deploy(site);
    }

  }, [ecosystem.site, config.forestEncounter]);

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
      backgroundColor: auth.backgroundColor,
      site: ecosystem.site,
    }));

    // 後でtextの中身を直接いじるので同一内容のMessageを新たに作って渡す
    bot.current.execute(new Message('speech', {
      text: userInput,
      name: auth.displayName,
      person: 'user',
      mood: 'peace',
      avatarPath: auth.photoURL,
      backgroundColor: auth.backgroundColor,
      site: ecosystem.site,
    }), props.writeLog);

    setUserInput("");
    event.preventDefault();
  }

  function handleChangePanelSize(size) {
    setPanelSize(prev => {
      let newSize = prev + size;
      newSize = newSize < 0 ? 0 : newSize;
      newSize = newSize < panelWidth.length ? newSize : panelWidth.length - 1;
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
            backgroundColor={bot.current.state.config.backgroundColor}
            photoURL={bot.current.photoURL}
            status={bot.current.state.status}
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