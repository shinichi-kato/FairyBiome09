import React, { useContext, useState } from "react";
import { navigate } from 'gatsby';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Avatar from '@material-ui/core/Avatar';
import ArrowBackIcon from '@material-ui/icons/ArrowBackIos';

import RootEditor from './RootEditor';
import ConfigEditor from './ConfigEditor';

import { BiomebotContext } from '../Biomebot/BiomebotProvider';
import { FirebaseContext } from "../Firebase/FirebaseProvider";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
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
    config     config編集。<ボタンでrootへ
    work       work編集。<ボタンでrootへ
    main       main編集。<ボタンでrootへ
    part       currentPart編集 <ボタンでrootへ

  */
  const classes = useStyles();
  const fb = useContext(FirebaseContext);
  const bot = useContext(BiomebotContext);

  const [currentPart, setCurrentPart] = useState('');
  const [page, setPage] = useState('root')

  function handleChangePage(newPage,newPart) {
    if(newPart){
      setCurrentPart(newPart);
    }
  }

  function handleClickBack(){
    if (page === 'root'){
      navigate('/');
    }
  }

  const botState = bot.state;

  return (
    <>
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
              src={`../../avatar/${fb.photoURL}`} alt={fb.photoURL} />
          </IconButton>
        </Toolbar>
      </AppBar>
      {
        page === 'root' &&
        <RootEditor
          state={botState}
          handleChangePage={handleChangePage}
        />
      }
      { page === 'config' && 
        <ConfigEditor 
          config={botState.config}
        /> 
      }
    </>
  )
}