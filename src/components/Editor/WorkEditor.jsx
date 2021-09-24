import React, { useState, useContext, useEffect } from "react";
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import SaveIcon from '@mui/icons-material/SaveAlt';
import { ItemPaper, FabContainerBox } from './StyledWigets';
import { DataGrid } from '@mui/x-data-grid';
import { BiomebotContext } from '../biomebot/BiomebotProvider';


const columns = [
  { field: 'key', headerName: '名前', width: 120 },
  { field: 'value', headerName: '値', width: 290 },
];

function lister(obj) {
  let work = [];
  let i = 0;
  for (let node in obj) {
    if (obj.hasOwnProperty(node)) {

      let value = obj[node];
      // if(Array.isArray(value)){
      // 	value = value.join(',');
      // }
      // if(typeof value === 'number'){
      // 	value = `${value}`;
      // }
      work.push({ id: i, key: node, value: value });
      i++;
    }
  }
  return work;
}

export default function WorkEditor() {
  /*
    state.workを編集

    state.workは辞書で、それをリストに変換して表示する。
  */
  const bot = useContext(BiomebotContext);
  const [message, setMessage] = useState("");

  const [rows, setRows] = useState([]);

  useEffect(() => {
    setRows(lister(bot.work));

  }, [bot.work]);

  function handleSave() {

  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      sx={{ margin: theme => theme.spacing(1) }}
    >
      <ItemPaper elevation={0} >
        <Box>
          作業記憶
        </Box>
        <Box
          height={600}
        >
          <DataGrid
            rows={rows}
            columns={columns}
            hideFooterSelectedRowCount
          />
        </Box>
      </ItemPaper>
      <FabContainerBox>
        <Fab
          variant="extended"
          aria-label="save"
          onClick={handleSave}
        >
          <SaveIcon sx={{ marginRight: theme => theme.spacing(1) }} />
          保存{message}
        </Fab>
      </FabContainerBox>

    </Box>
  )
}