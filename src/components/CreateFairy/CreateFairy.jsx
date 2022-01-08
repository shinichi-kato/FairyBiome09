import React, { useContext, useState, useEffect } from "react";
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
import { AuthContext } from "../Auth/AuthProvider";
import { ImageListItemBar } from "@mui/material";
import { fbio } from '../../firebase';


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
    チャットボットを既存データから読み込む。
    読み込むデータは/static/chatbotのうちbotIdの付与されていないデータ、
    またはfirestore上でuserが保存したものである。/static/chatbotの情報は
    props経由で取得し、fs上のデータはこのコンポーネントでロードする。


    チャットボットを新規作成したときに名前と背景色を設定する。
    ※これから実装

    アプリの状態がappStateで渡されてくる。
    props.appState        表示要素
    ---------------------------------------------------------
    'new'           プロローグにnavigate
    'landing'       タイトル
    'authOk'        タイトル ユーザアカウント
    'continue'      タイトル ユーザアカウント 上書き確認メッセージ
    'exec'          タイトル ユーザアカウント チャットボット選択画面    
    'ready'          タイトル ユーザアカウント 戻るボタン

    このページを表示するurlへの直リンクの場合/へ転送
    
    props.chatbots = [
      {   name: string,
          creator: string,
          directory: string,
          backgroundColor:string,
          description: string,}
    ]
  */
  const auth = useContext(AuthContext);
  const bot = useContext(BiomebotContext);
  const appState = STATE_TABLE[props.appState];

  const [fsChatbots, setFsChatbots] = useState(props.chatbots);
  const [currentDirectory, setCurrentDirectory] = useState(null);
  const [currentDescription, setCurrentDescription] = useState(null);



  useEffect(() => {
    if (auth.uid) {
      (async () => {
        setFsChatbots([...props.chatbots, ...await fbio.listBots(auth.uid)])
      })()
    }
  }, [auth.uid, fsChatbots, props.chatbots])

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
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            新しい妖精
          </Typography>
          {appState > 0 &&
            <IconButton
              onClick={auth.openUpdateDialog}
            >
              <Avatar
                aria-label="user"
                src={`../../avatar/${auth.photoURL}`} alt={auth.photoURL} />
            </IconButton>
          }

        </Toolbar>
      </AppBar>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        sx={{ paddingTop: "3em", }}
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
                backgroundColor: theme => theme.palette.background.paper,
                width: '100%',
              }}
            >
              <ImageList
                sx={{
                  width: 500,
                  height: 500,
                  // Promote the list into his own layer on Chrome. This cost memory but helps keeping high FPS.
                  transform: 'translateZ(0)',
                }}
                cols={3}
              >
                {fsChatbots.map(chatbot => (
                  <ImageListItem key={chatbot.name}
                    onClick={() => handleClickTile(chatbot.directory)}
                    sx={{
                      border: "4px solid",
                      borderColor: chatbot.directory === currentDirectory ? 'primary.main' : '#FFFFFF',
                    }}
                  >
                    <img src={`../../chatbot/${chatbot.directory}/peace.svg`}
                      style={{
                        backgroundColor: chatbot.backgroundColor,
                        width: 200,
                      }}
                      alt={chatbot.directory}
                    />
                    <ImageListItemBar
                      title={chatbot.name}
                      subtitle={chatbot.description}
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
              {bot.state.displayName} が仲間になっています
            </Box>
            <Box>
              <Button
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