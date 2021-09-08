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
import MainEditor from './MainEditor';
import PartEditor from './PartEditor';

import { BiomebotContext } from '../biomebot/BiomebotProvider';
import { FirebaseContext } from "../Firebase/FirebaseProvider";

import FooterSvg from './footer.inline.svg';

const useStyles = makeStyles((theme) => ({
  rootWhoseChildUsesFlexGrow: {
    width: 480,
    height: "calc( 100vh - 48px )",
    backgroundColor: "#e0e0e0",
    overflow: "hidden",
    position: "relative",
  },
  mainView: {
    width: 480,
    flexGrow: 1,
    overflowY: "scroll",
    overflowX: "hidden"
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
}));

const initialState={
  page: "root",
  part: null
};

function reducer(state,action){
  switch(action.type){
    case 'ChangePage': {
      return {
        page: action.page,
        part: action.part,
      }
    }
    default :
      throw new Error(`invalid action ${action.type}`);
  }
}

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

  const [state,dispatch] = useReducer(reducer,initialState)

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

  function handleChangePage(page, part) {
    dispatch({type:'ChangePage',page:page,part:part});
  }

  function handleClickBack() {
    const dest = route[page].back;
    if (dest === null) {
      navigate('/');
    } else {
      dispatch({type:'ChangePage',page:dest});
    }

  }

  return (
    <Box
      display="flex"
      className={classes.rootWhoseChildUsesFlexGrow}
      flexDirection="column"
      position="relative"
      flexGrow={1}
    >
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
      <Box
        className={classes.mainView}
      >
        <Box >
          {
            state.page === 'root' &&
            <RootEditor
              state={bot.state}
              work={bot.work}
              photoURL={bot.photoURL}
              handleChangePage={handleChangePage}
            />
          }
          {
            state.page === 'config' &&
            <ConfigEditor />
          }
          {
            state.page === 'work' &&
            <WorkEditor />
          }
          {
            page === 'main' &&
            <MainEditor />
          }
          {
            state.page === 'part' &&
            <PartEditor
              part={state.part}
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