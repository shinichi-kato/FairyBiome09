import React, { useState, useContext, useEffect, useMemo } from "react";
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import { ListItemSecondaryAction } from "@mui/material";
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import Fab from '@mui/material/Fab';

import ArrowForwardIcon from '@mui/icons-material/ArrowForwardIos';
import EmojiPeopleIcon from '@mui/icons-material/EmojiPeople';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import BodyPartIcon from '@mui/icons-material/AccessibilityNew';
import EmotionPartIcon from '@mui/icons-material/FavoriteBorder';
import MindPartIcon from '@mui/icons-material/Sms';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

import { FabContainerBox } from './StyledWigets';

import BotMonitor from './BotMonitor';
import ToolMenu from './ToolMenu';

import { AuthContext } from "../Auth/AuthProvider";
import { BiomebotContext } from '../biomebot/BiomebotProvider';
import { fbio } from '../../firebase';

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
    deletable: false,
  },
  {
    icon: <FlashOnIcon style={{ color: "#cfaf70" }} />,
    title: "作業記憶",
    page: "work",
    deletable: false,
  },
  {
    icon: <MenuBookIcon style={{ color: "#946ecc" }} />,
    title: "メイン辞書",
    page: "main",
    deletable: false,
  },
];

const partIconDict = {
  'sleep': <BodyPartIcon />,
  'sleepy': <BodyPartIcon />,
  'wake': <BodyPartIcon />,
  'cheer': <EmotionPartIcon />,
  'down': <EmotionPartIcon />,
};

function toArray(data) {
  // scriptのノードは略記のため文字列またはリストとして格納してある。
  // in: "not_found"
  // または
  // in: ["not_found","??"]
  // リストはそのまま、文字列は要素が一つのリストに変換して返す
  return typeof data === 'string' ? [data] : data;
}

export default function RootEditor(props) {
  const auth = useContext(AuthContext);
  const bot = useContext(BiomebotContext);
  const [message, setMessage] = useState("");
  const [partToDelete, setPartToDelete] = useState(false);


  function handleClickDeleteButton(partName) {
    setPartToDelete(partName);
  }

  function handleClose() {
    setPartToDelete(false);
  }

  function handleDeletePart() {
    props.handleDeletePart(partToDelete);
    setPartToDelete(false);
  }


  const memorizedParts = useMemo(() => {
    let initPO = {};
    for (let p of bot.state.config.initialPartOrder) {
      initPO[p] = true;
    }

    let parts = [];
    for (let part in bot.state.parts) {
      parts.push({
        icon: part in partIconDict ? partIconDict[part] : <MindPartIcon />,
        title: part,
        page: "part",
        part: part,
        isInPartOrder: part in initPO,
        deletable: true,
      })
    }
    return parts;
  }
    , [bot.state.parts, bot.state.config.initialPartOrder]);

  function lister(items) {
    return items.map(item =>
      <ListItem button key={item.title}
        onClick={() => props.handleChangePage(item.page, item.part)}
      >
        <ListItemIcon>
          {item.icon}
        </ListItemIcon>
        <ListItemText
          primary={item.title}
          secondary={
            item.isInPartOrder === false &&
            <Typography variant="body2" sx={(theme) => ({ color: theme.palette.error.main })}>
              基本設定の「初期のパート順」に含まれていません
            </Typography>
          } />
        <ArrowForwardIcon />
        {item.deletable &&
          <ListItemSecondaryAction>
            <IconButton edge="end" aria-label="delete"
              onClick={() => handleClickDeleteButton(item.part)}
            >
              <DeleteIcon />
            </IconButton>
          </ListItemSecondaryAction>
        }
      </ListItem>
    )

  }

  function handleSave() {
    /* 
      indexDB上に保存したchatbotのデータをfirestoreに保存。
      スクリプトはscriptデータベースに保存されており、indexedDBから得たデータは
      下記のようになっている。
      {
        botId: "ujYHlovaabQW72AZsXOBUZHHuDN2"
        id: "0"
        in: "{NOT_FOUND}"
        next: "01"
        out: Array(6)
        0: "にゃはは！"
        1: "にゃお〜"
        2: "にゃにゃ"
        3: "..."
        4: "どういうことにゃ？"
        5: "そうにゃの"
        length: 6
        [[Prototype]]: Array(0)
        partName: "cheer"
        prev: null
      },. ...

      これをobj形式
      {
          "in": "{enter_night}",
          "out": ["ΦwΦキラーン・・","{enter_cheer}遊ぼう！"]
      },  ...
      に変換してobjに加える。firestoreに保存することでfirestore上のidが得られる。
      id値を更新してconfigを上書きする。
    */

    (async () => {
      let obj = await bot.load(auth.uid);
      for (let partName in obj.parts) {
        const s = await bot.loadScript(partName);

        obj.parts[partName].script = s.map(n => (
          { in: toArray(n.in), out: toArray(n.out) }
        ));
      }

      const fsBotId = await fbio.save(obj, auth.uid);
      await bot.save('config', {
        ...obj.config,
        fsBotId: fsBotId
      });
      setMessage("ok");
    })();
  }


  useEffect(() => {
    let id;
    if (message !== "") {
      id = setTimeout(() => setMessage(""), 5000);
    }
    return () => {
      clearTimeout(id);
    }
  }, [message]);

  const open = partToDelete !== false;

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
        sx={{
          display: "flex",
          flexDirection: "column"
        }}
      >
        <Box
          sx={{ alignSelf: "flex-end" }}>
          <ToolMenu
            handleImport={props.handleImport}
            handleExport={props.handleExport}
          />
        </Box>
        <Box alignSelf="center">
          <BotMonitor
            photoURL={props.photoURL}
            state={bot.state}
            work={bot.work}
          />
        </Box>
      </ItemPaper>
      <ItemPaper elevation={0} >
        <List aria-label="main menu">
          {lister(menus)}
          <ListSubheader>パート</ListSubheader>
          {lister(memorizedParts)}
          <ListItem button key="_newPart_"
            onClick={props.handleAddNewPart}
            sx={{ backgroundColor: theme => theme.palette.primary }}
          >
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>
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

      <Box>
        <Dialog
          open={open}
          onClose={handleClose}
          aria-labelledby="confirm-delete"
          aria-describedby="confirm-delete-description"
        >
          <DialogTitle id="confirm-delete">
            パート{partToDelete} を削除します
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="confirm-delete-description">
              パートとスクリプトを削除します。削除後はもとに戻せません。
            </DialogContentText>
            <DialogActions>
              <Button onClick={handleClose}>取り消す</Button>
              <Button onClick={handleDeletePart} >削除する</Button>
            </DialogActions>
          </DialogContent>
        </Dialog>
      </Box>


    </Box>
  )
}