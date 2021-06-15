import React, { useContext, useState } from "react";
import { navigate } from "gatsby";
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Avatar from '@material-ui/core/Avatar';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import WarningIcon from '@material-ui/icons/Warning';

import { BiomebotContext } from '../biomebot/BiomebotProvider';
import { FirebaseContext } from "../Firebase/FirebaseProvider";
import { GridListTileBar } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
  gridContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
    width: '100%',
  },
  gridList: {
    flexWrap: 'nowrap',
    // Promote the list into his own layer on Chrome. This cost memory but helps keeping high FPS.
    transform: 'translateZ(0)',
  },
  crest: {
    width: "100%",
    padding: theme.spacing(1),
  },
  crestContainer: {
    width: "80%",
  },
  button: {
    fontSize: 18,
    padding: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  main: {
    paddingTop: "3em",
  }
}));

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
  const classes = useStyles();
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
          <Typography variant="h6" className={classes.title}>
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
        className={classes.main}
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
              className={classes.gridContainer}
            >
              <GridList
                className={classes.gridList}
                cols={2.5}
              >
                {props.chatbots.map(bot => (
                  <GridListTile key={bot.name}
                    onClick={() => handleClickTile(bot.directory)}
                  >
                    <img src={`../../chatbot/${bot.directory}/peace.svg`}
                      style={{
                        backgroundColor: bot.backgroundColor,
                        width: 400,
                      }}
                      alt={bot.directory}
                    />
                    <GridListTileBar
                      title={bot.name}
                      classes={{
                        root: classes.titleBar,
                        title: classes.title,
                      }}
                    />
                  </GridListTile>
                ))}

              </GridList>
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