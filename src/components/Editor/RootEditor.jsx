import React from "react";
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';

import ArrowForwardIcon from '@mui/icons-material/ArrowForwardIos';
import EmojiPeopleIcon from '@mui/icons-material/EmojiPeople';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PartIcon from '@mui/icons-material/RecordVoiceOver';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import BotMonitor from './BotMonitor';

import { AuthContext } from "../Auth/AuthProvider";
import { BiomebotContext } from '../biomebot/BiomebotProvider';
import { generate } from '../../firebase';

export const ItemPaper = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
  width: `calc(480px - ${theme.spacing(3)}px)`
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
  const auth = useContext(AuthContext);
  const bot = useContext(BiomebotContext);

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

  function handleSave() {
    // firestoreへの保存
    (async () => {
      // dbの内容をobjに変換
      const obj = await bot.load();
      await generate(obj, auth.uid);
    })();
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      sx={{
        margin: theme => theme.spacing(1),
        width: theme => (`calc(480px - ${theme.spacing(1)}px)`)
      }}
    >
      <ItemPaper
        elevation={0}
      >
        <Box alignSelf="center">
          <BotMonitor
            photoURL={props.photoURL}
            state={props.state}
            work={props.work}
          />
        </Box>
      </ItemPaper>
      <ItemPaper elevation={0} >
        <List aria-label="main menu">
          {lister(menus)}
          <ListSubheader>パート</ListSubheader>
          {lister(parts)}
          <ListItem button key="_newPart_"
            onClick={props.handleAddNewPart}
            sx={{ backgroundColor: theme => theme.palette.primary }}
          >
            <ListItemText primary="パートの追加" />
          </ListItem>
        </List>

      </ItemPaper>

      <FabContainerBox>
        <Fab
          variant="extended"
          aria-label="save"
          onClick={handleSave}
          color="primary"
        >
          <CloudUploadIcon sx={{ marginRight: theme => theme.spacing(1), }} />保存{message}
        </Fab>
      </FabContainerBox>

    </Box>
  )
}