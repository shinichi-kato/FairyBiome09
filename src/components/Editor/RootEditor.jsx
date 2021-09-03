import React from "react";
import Box from '@material-ui/core/Box';
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

  let parts = [];
  for (let part in props.state.parts) {
    parts.push({
      icon: <PartIcon />,
      title: part,
      page: "part",
      part: part,
    })
  }

  function handleChangePage(newPage) {
    props.handleChangePage(newPage)
  };

  function lister(items) {
    return items.map(item =>
      <ListItem button key={item.title}
        onClick={() => handleChangePage(item.page, item.part)}
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
    <>
      <Box alignSelf="center">
        <BotMonitor
          state={props.state}
          work={props.work}
        />
      </Box>
      <Box>
        <List aria-label="main menu">
          {lister(menus)}
          <ListSubheader>パート</ListSubheader>
          {lister(parts)}
        </List>
      </Box>
    </>
  )
}