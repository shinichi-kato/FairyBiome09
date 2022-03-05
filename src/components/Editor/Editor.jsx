import React, { useContext, useEffect, useReducer, useState } from "react";
import { navigate } from 'gatsby';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIos';

import RootEditor from './RootEditor';
import ConfigEditor from './ConfigEditor';
import WorkEditor from './WorkEditor';
import MainEditor from './MainEditor';
import PartEditor from './PartEditor';
import ScriptEditor from "./ScriptEditor";

import { BiomebotContext } from '../biomebot/BiomebotProvider';
import { AuthContext } from "../Auth/AuthProvider";

import FooterSvg from './footer.inline.svg';

const initialState = {
  page: "unload",
  part: null
};

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


function reducer(state, action) {
  switch (action.type) {
    case 'ChangePage': {
      return {
        page: action.page,
        part: action.part || state.part,
      }
    }
    case 'connect': {
      return {
        page: 'root',
        part: null,
      }
    }
    default:
      throw new Error(`invalid action ${action.type}`);
  }
}

export default function Editor({ avatarDictSnap }) {
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
  const auth = useContext(AuthContext);
  const bot = useContext(BiomebotContext);
  const [avatarList, setAvatarList] = useState([]);

  const [state, dispatch] = useReducer(reducer, initialState)

  // ------------------------------------------------------------------
  // botが読み込まれていなければindexDBから読み込む
  //

  useEffect(() => {
    if (bot.state.status === 'unload') {
      bot.load(auth.uid);
    } else {
      dispatch({ type: 'connect' });
      const path = bot.state.config.avatarPath;
      const list = [];

      for (let node of avatarDictSnap) {
        if (node.relativeDirectory === path) {
          list.push(node.name);
        }
      }
      setAvatarList(list);
    }
  }, [bot.state.status, bot, auth.uid, avatarDictSnap]);

  // ------------------------------------------------------------------------------------
  //
  // json I/O
  //

  function handleImport() {

  }

  function handleExport() {
    (async () => {
      const json = bot.exportJson();
      const blob = new Blob([json], { type: 'application/json' });
      const href = await URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = "chatbot.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })();
  }


  function handleChangePage(page, part) {
    dispatch({ type: 'ChangePage', page: page, part: part });
  }

  function handleClickBack() {
    const dest = route[state.page].back;
    if (dest === null) {
      navigate('/');
    } else {
      dispatch({ type: 'ChangePage', page: dest });
    }

  }

  function handleAddNewPart() {
    bot.editPart({ type: 'addNew' });
  }

  function handleDeletePart(partName) {
    bot.editPart({ type: 'delete', partName: partName });
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "calc( 100vh - 48px )",
        backgroundColor: "#e0e0e0",
        overflow: "hidden",
        position: "relative",
        flexGrow: 1,
      }}
    >
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            sx={{ marginRight: theme => theme.spacing(2), }}
            color="inherit"
            aria-label="menu"
            onClick={handleClickBack}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            チャットボットの編集
          </Typography>
          <IconButton
            onClick={auth.openUpdateDialog}
          >
            <Avatar
              aria-label="user"
              src={`../../avatar/${auth.photoURL}`} alt={auth.photoURL}
            />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        sx={{
          width: "100%",
          flexGrow: 1,
          overflowY: "scroll",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box >
          {
            state.page === 'unload' &&
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <Box>
                <Typography>ロード中</Typography>
              </Box>
            </Box>
          }
          {
            state.page === 'root' &&
            <RootEditor
              handleChangePage={handleChangePage}
              handleAddNewPart={handleAddNewPart}
              handleDeletePart={handleDeletePart}
              handleExport={handleExport}
              handleImpoirt={handleImport}
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
            state.page === 'main' &&
            <MainEditor />
          }
          {
            state.page === 'part' &&
            <PartEditor
              partName={state.part}
              avatarList={avatarList}
              handleChangePage={handleChangePage}
            />
          }
          {
            state.page === 'script' &&
            <ScriptEditor
              partName={state.part}
            />
          }
        </Box>
        <Box
          sx={{ alignSelf: "center" }}
        >
          <FooterSvg />
        </Box>
      </Box>
    </Box>
  )
}