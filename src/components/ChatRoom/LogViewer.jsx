import React, { useLayoutEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Typography from '@mui/material/Typography';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import ClearIcon from '@mui/icons-material/Clear';
import HotelIcon from '@mui/icons-material/Hotel';

const moodBadgeIcon = {
  peace: null,
  cheer: <MusicNoteIcon />,
  down: <ClearIcon />,
  sleep: <HotelIcon />,
  absent: null,
}

function LeftBalloon(props) {
  const message = props.message;
  const avatarSrc = message.person === 'bot' ?
    `/chatbot/${message.avatarPath}/avatar.svg`
    :
    `${message.avatarPath}`;
  const texts = message.text?.split('<br/>') || ["undefined"];
  const backgroundColor = message.backgroundColor || "#FFFFFFBB";



  return (
    <Box
      display="flex"
      flexDirection="row"
      alignSelf="flex-start"
    >
      <Box>
        <Badge
          badgeContent={moodBadgeIcon[message.mood]}
          invisible={moodBadgeIcon[message.mood] === null}
        >
          <Avatar alt={message.name} src={avatarSrc} />
        </Badge>
      </Box>
      <Box
        sx={{
          borderRadius: "15px 15px 15px 0px",
          padding: "0.5em",
          marginLeft: 4,
          backgroundColor: backgroundColor,
        }}
      >
        {texts.map((text, index) => <Typography variant="body1" key={index}>{text}</Typography>)}
        <Typography variant="caption">{message.name}</Typography>
      </Box>
    </Box>
  )
}

function RightBalloon(props) {
  const message = props.message;
  const avatarSrc = message.person === 'bot' ?
    `/chatbot/${message.avatarPath}/avatar.svg`
    :
    `/avatar/${message.avatarPath}`;
  const backgroundColor = message.backgroundColor || "#FFFFFFBB";

  return (
    <Box
      display="flex"
      flexDirection="row"
      alignSelf="flex-end"
    >

      <Box
        sx={{
          borderRadius: " 15px 15px 0px 15px",
          padding: "0.5em",
          marginRight: 4,
          backgroundColor: backgroundColor,
        }}
      >
        <Typography variant="body1">{message.text}</Typography>
        <Typography variant="caption">{message.name}</Typography>

      </Box>
      <Box>
        <Badge
          badgeContent={moodBadgeIcon[message.mood]}
          invisible={moodBadgeIcon[message.mood] === null}
        >
          <Avatar alt={message.name} src={avatarSrc} />
        </Badge>
      </Box>
    </Box>
  )
}

function SystemMessage(props) {
  const message = props.message;

  return (
    <Box
      display="flex"
      flexDirection="row"
      alignItems="center"
    >
      <Box>
        <Typography>{message.text}</Typography>
      </Box>
    </Box>
  )
}

export default function LogViewer(props) {
  /*
    props.logの内容をレンダリング
    ユーザ本人：右側の吹き出し
    ほかのユーザ・チャットボット：左側の吹き出し
    ユーザは右側、bot,othersは左側、それら以外は環境やシステムのメッセージで
    吹き出しではない表示.
  */

  const scrollBottomRef = useRef();

  useLayoutEffect(() => {
    // 書き換わるたびに最下行へ自動スクロール
    scrollBottomRef?.current?.scrollIntoView();
  }, [props.log]);


  const messages = props.log.map(message => {

    switch (message.person) {
      case 'user': return <RightBalloon key={message.id} message={message} />
      case 'bot': return <LeftBalloon key={message.id} message={message} />
      case 'other': return <LeftBalloon key={message.id} message={message} />
      default: return <SystemMessage key={message.id} message={message} />
    }
  });

  return (
    <Box
      display="flex"
      flexDirection="column"
    >
      {messages}
      <div ref={scrollBottomRef} />
    </Box>
  )
}