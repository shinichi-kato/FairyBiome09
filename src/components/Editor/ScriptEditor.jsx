import React, { useState, useContext, useEffect, useCallback } from "react";

import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import SaveIcon from '@mui/icons-material/SaveAlt';
import { DataGrid } from '@mui/x-data-grid';
import { BiomebotContext } from '../biomebot/BiomebotProvider';
import { Typography } from "@mui/material";
import { ItemPaper, FabContainerBox } from './StyledWigets';

const description = {
  'knowledge':
    <Typography>
      相手の発言がINと似ていたらOUTを発言します。
      カンマ(,)で区切るとそれらの中からランダムに選んだ一つを使用します。
      相手の発言がどの行とも似ていなかったらNOT_FOUNDの行から発言を選びます。
    </Typography>,
  'episode':
    <Typography>
      相手の発言がスクリプトの中のある行と似ていたら、その次の行を発言にします。
    </Typography>,
  'curiosity':
    <Typography>
      相手の発言がINと似ていたらOUTを発言します。
      カンマ(,)で区切るとそれらの中からランダムに選んだ一つを使用します。
      相手の発言がどの行とも似ていなかったら「なんて言ったらいいの？」と質問して、
      相手からの答えを覚えます。
    </Typography>,
};

const columns= {
  'knowledge': [
    {field: 'in', headerName: 'IN', flex: 0.4, editable: true},
    {field: 'out', headerName: 'OUT',flex: 1, editable: true},
  ],
  'episode': [
    {field: 'id',headerName: '行番号', flex:0.2},
    {field: 'out',headerName: 'セリフ', flex:1, editable: true},
  ],
  'curiosity': [
    {field: 'in', headerName: 'IN', flex: 0.4, editable: true},
    {field: 'out', headerName: 'OUT',flex: 1, editable: true},
  ]
};



function rows2obj(rows) {
  let obj = {};
  for (let row of rows) {
    obj[row.key] = row.value;
  }
  return obj;
}

function obj2rows(obj) {
  let work = [];
  let i = 0;
  for (let node in obj) {
    if (obj.hasOwnProperty(node)) {
      work.push({ id: i, key: node, value: obj[node] });
      i++;
    }
  }
  console.log("obj2rows",obj)
  return work;
}

export default function ScriptEditor(props) {
  const bot = useContext(BiomebotContext);
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const partName = props.partName
  const part = bot.state.parts[partName];

  useEffect(() => {
    setRows(obj2rows(bot.loadScript(partName)))
  }, [bot, partName]);

  const handleCellEditCommit = useCallback(
    ({id, field, value})=>{

    },[rows]
  )

  function handleSave(){
    (async () => {

      await bot.save('main', rows2obj(rows));
      setMessage("ok");
    })()  
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

  return (
    <Box
      display="flex"
      flexDirection="column"
      sx={{margin: theme=>theme.spacing(1)}}
    >
      <ItemPaper elevation={0} >
        <Box>
        <Typography variant="h5">スクリプト<br/>{props.partNmae}</Typography>
        </Box>
        <Box>
          {description[partName]}
        </Box>
        <Box>
          <DataGrid
            height={500}
            rows={rows}
            columns={columns[part.kind]}
            hideFooterSelectedRowCount
            oncellEditCommit={handleCellEditCommit}
            />
        </Box>
      </ItemPaper>
      <FabContainerBox>
        <Fab
          variant="extended"
          aria-label="save"
          onClick={handleSave}
        >
          <SaveIcon sx={{marginRight: theme=>theme.spacing(1)}} />保存
          {message === "ok" && "- ok"}
        </Fab>
      </FabContainerBox>
    </Box>
  )
}