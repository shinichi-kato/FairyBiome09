import React, { useContext, useState } from "react";
import { navigate } from 'gatsby';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Avatar from '@material-ui/core/Avatar';
import Box from '@material-ui/core/Box';
import ArrowBackIcon from '@material-ui/icons/ArrowBackIos';

import BotMonitor from './BotMonitor';
import RootEditor from './RootEditor';
import ConfigEditor from './ConfigEditor';

import { BiomebotContext } from '../biomebot/BiomebotProvider';
import { FirebaseContext } from "../Firebase/FirebaseProvider";

const useStyles = makeStyles((theme) => ({
  rootWhoseChildUsesFlexGrow: {
    width: 480,
    height: "calc( 100vh - 48px )",
  },
  mainView: {
    overflowY: "scroll",
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
}));

export default function Editor() {
  /* 
    チャットボットエディタのフレームワーク

    page
    --------------------------------------------------
    root       config,state,main,partを選ぶ画面。<ボタンで '/'へnavigate
    ├ config     config編集。<ボタンでrootへ
    ├ work       work編集。<ボタンでrootへ
    ├ main       main編集。<ボタンでrootへ
    └ part       currentPart編集 <ボタンでrootへ
     └ script  partのscript編集。 <ボタンでpartへ

  */
  const classes = useStyles();
  const fb = useContext(FirebaseContext);
  const bot = useContext(BiomebotContext);

  const [currentPart, setCurrentPart] = useState('');
  const [page, setPage] = useState('root')

  function handleChangePage(newPage, newPart) {
    if (newPart) {
      setCurrentPart(newPart);
    }
  }

  function handleClickBack() {
    if (page === 'root') {
      navigate('/');
    }
  }

  const botState = bot.state;

  return (
    <Box
      display="flex"
      className={classes.rootWhoseChildUsesFlexGrow}
      flexDirection="column"
      position="relative"
    >
      <Box>
        <AppBar position="static">
          <Toolbar>
            <IconButton
              edge="start"
              className={classes.menuButton}
              color="inherit"
              aria-label="menu"
              onClick={handleClickBack}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" className={classes.title}>
              チャットボットの編集
            </Typography>
            <IconButton
              onClick={fb.openUpdateDialog}
            >
              <Avatar
                aria-label="user"
                src={`../../avatar/${fb.photoURL}`} alt={fb.photoURL}
              />
            </IconButton>
          </Toolbar>
        </AppBar>
      </Box>
      <Box
        flexGrow={1}
        className={classes.mainView}
      >
        <Box alignSelf="center">
          <BotMonitor
            state={bot.state}
            work={bot.work}
          />
        </Box>
        <Box >
          {
            page === 'root' &&
            <RootEditor
              state={bot.state}
              handleChangePage={handleChangePage}
            />
          }
          {page === 'config' &&
            <ConfigEditor
              config={botState.config}
            />
          }
        </Box>
      </Box>
    </Box>
  )
}