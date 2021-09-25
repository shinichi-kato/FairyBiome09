import React, { useState, useContext, useEffect, useCallback } from "react";
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import SaveIcon from '@mui/icons-material/SaveAlt';
import { ItemPaper, FabContainerBox } from './StyledWigets';
import { DataGrid } from '@mui/x-data-grid';
import { BiomebotContext } from '../biomebot/BiomebotProvider';

import {initialWork} from '../biomebot/BiomebotProvider';

const columns = [
  { field: 'key', headerName: '名前', width: 120, editable: true },
  { field: 'value', headerName: '値', width: 290, editable: true },
];

function obj2rows(obj) {
  let work = [];
  let i = 0;
  for (let node in obj) {
    if (obj.hasOwnProperty(node)) {
      work.push({ id: i, key: node, value: obj[node] });
      i++;
    }
  }

  const lastItem = work[work.length - 1];
  if (lastItem.key === "" && lastItem.value === "") {
    work.pop();
  }

  return work;
}

function rows2obj(rows) {
  let obj = {...initialWork};
  
  for (let row of rows) {
    obj[row.key] = row.value;
  }
  return obj;
}

function setify(rows, column) {
  let bag = {};
  for (let row of rows) {
    bag[row[column]] = true;
  }
  return bag;
}

function maxId(rows) {
  let ids = rows.map(row => row.id);
  return Math.max(ids);

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
    setRows(obj2rows(bot.work));

  }, [bot.work]);

  function handleSave() {
    (async () => {
      await bot.save('work', rows2obj(rows));
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

  const handleCellEditCommit = useCallback(
    ({ id, field, value }) => {

      setRows(prevRows => {
        let newRows = rows.map(row => {

          const keys = setify(rows, "key");

          if (row.id === id) {
            if (field === 'key') {
              if (value in keys) {
                setMessage(`名前${value}が重複しています`);
                return row;
              }
              return { ...row, key: value }
            }
            else {
              return { ...row, [field]: value }
            }
          }
          return row;
        });

        // 最下行が空行でなければ空行を追加

        const lastItem = newRows[newRows.length - 1];
        if (lastItem.key !== "" || lastItem.value !== "") {
          newRows.push({ id: `${maxId(prevRows) + 1}`, key: "", value: "" });
        }

        return newRows;
      })

    }, [rows]
  );


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
            onCellEditCommit={handleCellEditCommit}
          />
        </Box>
      </ItemPaper>
      <FabContainerBox>
        <Fab
          variant="extended"
          aria-label="save"
          onClick={handleSave}
          color="primary"
        >
          <SaveIcon sx={{ marginRight: theme => theme.spacing(1) }} />
          保存{message}
        </Fab>
      </FabContainerBox>

    </Box>
  )
}