import React from "react";
import { styled } from '@mui/system';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import EditIcon from '@mui/icons-material/EditOutlined';
import ChatIcon from '@mui/icons-material/ChatOutlined';
import Typography from '@mui/material/Typography';

import FairyBiomeCrest from './fairybiome-crest.inline.svg';
import UserAccount from './UserAccount';
import { navigate } from 'gatsby';


const MenuButton = styled(Button)(({theme})=>({
  fontSize: 18,
  padding: theme.spacing(1),
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
  const appState = STATE_TABLE[props.appState];

  function handleToEdit() {
    navigate("/edit");
  }
  console.log(process.env.GATSBY_APP_VERSION)
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
    >
      <Box sx={{width: "80%"}}>
        <FairyBiomeCrest
          style={{
            // sx未対応？
            width: "100%",
            padding: 4
          }}
        />
      </Box>
      <Box>
        {appState > 0 && <UserAccount />}
      </Box>
      <Box>
        {appState > 1 &&
          <MenuButton
            onClick={props.handleNew}
          >
            はじめから
          </MenuButton>
        }
      </Box>

      <Box
        sx={{ padding:theme=>theme.spacing(2)}}
        visibility={appState > 2 ? "visible" : "hidden"}
      >
        <MenuButton
          onClick={props.handleContinue}
          startIcon={<ChatIcon />}
          variant="contained"
        >
          チャットを始める
        </MenuButton>
      </Box>
      <Box
        sx={{ padding:theme=>theme.spacing(2)}}
        visibility={appState > 2 ? "visible" : "hidden"}
      >
        <MenuButton
          startIcon={<EditIcon />}
          onClick={handleToEdit}>
          チャットボットのデータ編集
        </MenuButton>
      </Box>
      <Box>
        <Typography variant="caption">
          ver. {props.version}
        </Typography>
      </Box>
    </Box>
  )
}