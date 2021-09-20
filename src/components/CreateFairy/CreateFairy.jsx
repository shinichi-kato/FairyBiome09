import React, { useContext, useState } from "react";
import { navigate } from "gatsby";
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import WarningIcon from '@mui/icons-material/Warning';

import { BiomebotContext } from '../biomebot/BiomebotProvider';
import { FirebaseContext } from "../Firebase/FirebaseProvider";
import { ImageListItemBar } from "@mui/material";


const STATE_TABLE = {
  'new': 0,
  'landing': 1,
  'authOk': 2,
  'continue': 3,
  'exec': 4,
  'done': 5
};

export default function CreateFairy(props) {
  /* 
    アプリの状態がappStateで渡されてくる。
    props.appState        表示要素
    ---------------------------------------------------------
    'new'           プロローグにnavigate
    'landing'       タイトル
    'authOk'        タイトル ユーザアカウント
    'continue'      タイトル ユーザアカウント 上書き確認メッセージ
    'exec'          タイトル ユーザアカウント チャットボット選択画面    
    'ready'          タイトル ユーザアカウント 戻るボタン
    
    props.chatbots = [
      {   name: string,
          creator: string,
          directory: string,
          backgroundColor:string,
          description: string,}
    ]
  */
  const fb = useContext(FirebaseContext);
  const bot = useContext(BiomebotContext);
  const appState = STATE_TABLE[props.appState];

  const [currentDirectory, setCurrentDirectory] = useState(null);
  const [currentDescription, setCurrentDescription] = useState(null);

  // useEffect(()=>{
  //   if(appState === 0){
  //     navigate('/content/prologue1/');
  //   }
  // },[appState]);

  function handleAccept() {
    navigate('/content/prologue1/');
  }

  function handleClickTile(directory, description) {
    setCurrentDirectory(directory)
    setCurrentDescription(description);
  }

  function handleClickLoad() {
    fetch(`../../chatbot/${currentDirectory}/chatbot.json`)
      .then(res => res.json())
      .then(obj => {
        bot.generate(obj, currentDirectory)
          .then(() => {
            props.handleDone();
          });
      });
  }

  function handleReturn() {
    navigate('/');
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{flexGrow: 1}}>
            新しい妖精
          </Typography>
          {appState > 0 &&
            <IconButton
              onClick={fb.openUpdateDialog}
            >
              <Avatar
                aria-label="user"
                src={`../../avatar/${fb.photoURL}`} alt={fb.photoURL} />
            </IconButton>
          }

        </Toolbar>
      </AppBar>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        sx={{ paddingTop: "3em",}}
      >
        {props.appState === 'continue' &&
          <>
            <Box>
              <WarningIcon
                style={{
                  color: "#faa475",
                  fontSize: 60
                }}
              />
            </Box>
            <Box>
              すでに妖精{bot.displayName}のデータがあります。<br />
            新しく妖精を作ると{bot.displayName}は消滅します。<br />
            よろしいですか？
            </Box>
            <Box>
              <Button
                color="primary"
                variant="contained"
                onClick={handleAccept}>
                今の妖精を消して新しい妖精を作る
              </Button>
            </Box>
            <Box>
              <Button
                onClick={handleReturn}
              >
                中止
              </Button>
            </Box>
          </>
        }
        {props.appState === 'exec' &&
          <>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
                overflow: 'hidden',
                backgroundColor: theme=>theme.palette.background.paper,
                width: '100%',
              }}
            >
              <ImageList
                sx={{
                  flexWrap: 'nowrap',
                  // Promote the list into his own layer on Chrome. This cost memory but helps keeping high FPS.
                  transform: 'translateZ(0)',
                }}
                cols={2.5}
              >
                {props.chatbots.map(chatbot => (
                  <ImageListItem key={chatbot.name}
                    onClick={() => handleClickTile(chatbot.directory)}
                  >
                    <img src={`../../chatbot/${chatbot.directory}/peace.svg`}
                      style={{
                        backgroundColor: chatbot.backgroundColor,
                        width: 400,
                      }}
                      alt={chatbot.directory}
                    />
                    <ImageListItemBar
                      title={chatbot.name}
                      sx={{
                        flexGrow: 1,
                      }}
                    />
                  </ImageListItem>
                ))}

              </ImageList>
            </Box>
            <Box>
              {currentDescription}
            </Box>
            <Box>
              <Button
                color="primary"
                variant="contained"
                fullWidth
                onClick={handleClickLoad}
                disabled={currentDirectory === null}
              >
                この妖精と仲間になる
              </Button>
            </Box>
          </>
        }
        {props.appState === 'done' &&
          <>
            <Box>
              {bot.state.config.displayName} が仲間になっています
            </Box>
            <Box>
              <Button
                color="primary"
                variant="contained"
                onClick={handleReturn}>
                戻る
            </Button>
            </Box>
          </>
        }
      </Box>
    </>

  )
}