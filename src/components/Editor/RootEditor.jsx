import React from "react";
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

const menus = [
  {
    icon:<EmojiPeopleIcon/>,
    title: "基本設定",
    page: "config",
  },
  {
    icon:<FlashOnIcon/>,
    title: "作業記憶",
    page: "work",
  },
  {
    icon:<MenuBookIcon/>,
    title: "メイン辞書",
    page: "main",
  },
];

export default function RootEditor(props){
  
  let parts = [];
  console.log("state=",props.state);
  for (let part in props.state.parts){
    parts.push({
      icon:<PartIcon/>,
      title:part,
      page: "part",
    })
  }

  function handleChangePage(newPage){
    props.handleChangePage(newPage)
  };

  function lister(items){
    return items.map(item=>
      <ListItem button key={item.page}
        onClick={()=>handleChangePage(item.page,item.title)}
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
    <List aria-label="main menu">
      {lister(menus)}
      <ListSubheader>パート</ListSubheader>
      {lister(parts)}
    </List>
  )
}