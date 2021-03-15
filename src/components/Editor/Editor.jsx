import React, {useContext} from "react";
import {BotContext} from "../Bot/BotProvider";
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import MoreIcon from '@material-ui/icons/MoreVert';
import ArrowBackIcon from '@material-ui/icons/ArrowBackIos';
import Container from '@material-ui/core/Container';

import FairyPortrait from './FairyPortrait';

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
  rootWhoseChildUsesFlexGrow: {
    width: "100%",
    
  },
  mainView: {
    height: "calc ( 100vh - 48px )",
    overflowY: "scroll", 
  },
}));


export default function Editor(){
  /*
    チャットボットの編集
  */
  const classes = useStyles();
  const bot = useContext(BotContext);

  return (
    <Box
      display="flex"
      flexDirection="column"
      className={classes.rootWhoseChildUsesFlexGrow}
    >
      <Box>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="exit">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            編集
          </Typography>
          <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu">
            <MoreIcon />
          </IconButton>
        </Toolbar>
        <Container>
          <FairyPortrait fairy={bot}/>
        </Container>
      </AppBar>
      </Box>
      <Box grow={1}>

      </Box>
    </Box>  
  )
}