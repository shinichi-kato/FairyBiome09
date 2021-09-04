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

import RootEditor from './RootEditor';
import ConfigEditor from './ConfigEditor';
import WorkEditor from './WorkEditor';
import PartEditor from './PartEditor';

import { BiomebotContext } from '../biomebot/BiomebotProvider';
import { FirebaseContext } from "../Firebase/FirebaseProvider";

import FooterSvg from './footer.inline.svg';

const useStyles = makeStyles((theme) => ({
  rootWhoseChildUsesFlexGrow: {
    width: 480,
    height: "calc( 100vh - 48px )",
    backgroundColor: "#e0e0e0",
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

  const route = {
    'root': {
      back: null,
    },
    'config': {
      back: 'root'
    },
    'work': {
      back: 'root'
    },
    'main': {
      back: 'root'
    },
    'part': {
      back: 'root'
    },
    'script': {
      back: 'part'
    }
  };

  function handleChangePage(newPage, newPart) {
    if (newPage === 'part') {
      setCurrentPart(newPart);
    }
    setPage(newPage);
  }

  function handleClickBack() {
    const dest = route[page].back;
    if (dest === null) {
      navigate('/');
    }
    setPage(dest);

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
        <Box >
          {
            page === 'root' &&
            <RootEditor
              state={bot.state}
              work={bot.work}
              handleChangePage={handleChangePage}
            />
          }
          {
            page === 'config' &&
            <ConfigEditor
            />
          }
          {
            page === 'work' &&
            <WorkEditor />
          }
          {
            page === 'part' &&
            <PartEditor
              part={currentPart}
            />
          }
        </Box>
        <Box>
          <FooterSvg />
        </Box>
      </Box>
    </Box>
  )
}