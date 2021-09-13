import React from "react";
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Paper from '@material-ui/core/Paper';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';

import ArrowForwardIcon from '@material-ui/icons/ArrowForwardIos';
import EmojiPeopleIcon from '@material-ui/icons/EmojiPeople';
import FlashOnIcon from '@material-ui/icons/FlashOn';
import MenuBookIcon from '@material-ui/icons/MenuBook';
import PartIcon from '@material-ui/icons/RecordVoiceOver';

import BotMonitor from './BotMonitor';

const useStyles = makeStyles((theme) => ({
  root: {
    margin: theme.spacing(1),
    width: `calc(480px - ${theme.spacing(1)}px)`,
  },
  item: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    width: `calc(480px - ${theme.spacing(3)}px)`
  },
  newPart:{
    backgroundColor: theme.palette.primary
  }
}));

const menus = [
  {
    icon: <EmojiPeopleIcon style={{ color: "#8fd2eb" }} />,
    title: "基本設定",
    page: "config",
  },
  {
    icon: <FlashOnIcon style={{ color: "#cfaf70" }} />,
    title: "作業記憶",
    page: "work",
  },
  {
    icon: <MenuBookIcon style={{ color: "#946ecc" }} />,
    title: "メイン辞書",
    page: "main",
  },
];

export default function RootEditor(props) {
  const classes = useStyles();

  let parts = [];
  for (let part in props.state.parts) {
    parts.push({
      icon: <PartIcon />,
      title: part,
      page: "part",
      part: part,
    })
  }

  function lister(items) {
    return items.map(item =>
      <ListItem button key={item.title}
        onClick={() => props.handleChangePage(item.page, item.part)}
      >
        <ListItemIcon>
          {item.icon}
        </ListItemIcon>
        <ListItemText primary={item.title} />
        <ArrowForwardIcon />
      </ListItem>
    )

  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      className={classes.root}
    >
      <Paper
        className={classes.item} elevation={0}
      >
        <Box alignSelf="center">
          <BotMonitor
            photoURL={props.photoURL}
            state={props.state}
            work={props.work}
          />
        </Box>
      </Paper>
      <Paper className={classes.item} elevation={0} >
        <List aria-label="main menu">
          {lister(menus)}
          <ListSubheader>パート</ListSubheader>
          {lister(parts)}
          <ListItem button key="_newPart_"
            onClick={props.handleAddNewPart}
            className={classes.newPart}
          >
            <ListItemText primary="パートの追加" />
          </ListItem>
        </List>

      </Paper>

    </Box>
  )
}