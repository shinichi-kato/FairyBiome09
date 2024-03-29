import React, { useState, useContext, useEffect, useCallback } from "react";
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import Typography from "@mui/material/Typography";
import SaveIcon from '@mui/icons-material/SaveAlt';
import { DataGrid } from '@mui/x-data-grid';
import { BiomebotContext } from '../biomebot/BiomebotProvider';
import { ItemPaper, FabContainerBox } from './StyledWigets';

const columns = [
  { field: 'key', headerName: '名前', flex: 0.4, editable: true },
  { field: 'value', headerName: '値', flex: 1, editable: true },
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
  let obj = {};
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
  return Math.max(...ids);

}

export default function MainEditor() {
  const bot = useContext(BiomebotContext);
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setRows(obj2rows(bot.state.main))
  }, [bot.state.main]);

  function handleSave() {
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
          newRows.push({ id: maxId(prevRows) + 1, key: "", value: "" });
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
          <Typography variant="h5">主記憶</Typography>
          <Typography variant="body2">
            チャットボットが返答するときに使う設定や文字列を定義します。
            重複した「名前」は設定できません。<br />
            値をカンマ(,)で区切るとそれらの中からランダムに選んだ一つを使用します。
            値の中で{"{NAME}"}のように他の名前を使うと、それぞれの値に展開されます。
          </Typography>
        </Box>
        <Box
          height={600}
        >
          <DataGrid
            height={500}
            rows={rows}
            columns={columns}
            hideFooterSelectedRowCount
            onCellEditCommit={handleCellEditCommit}
          />
        </Box>
        <Typography color="error">
          {(message !== "" || message !== "ok") && message}
        </Typography>

      </ItemPaper>

      <FabContainerBox>
        <Fab
          variant="extended"
          aria-label="save"
          onClick={handleSave}
          color="primary"
        >
          <SaveIcon sx={{ marginRight: theme => theme.spacing(1), }} />保存
          {message === "ok" && "- ok"}
        </Fab>
      </FabContainerBox>

    </Box>
  )
}