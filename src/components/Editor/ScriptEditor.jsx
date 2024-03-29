import React, { useState, useContext, useEffect, useCallback } from "react";
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import SaveIcon from '@mui/icons-material/SaveAlt';
import { DataGrid, jaJP } from '@mui/x-data-grid';
import { BiomebotContext } from '../biomebot/BiomebotProvider';
import { Typography } from "@mui/material";
import { ItemPaper, FabContainerBox } from './StyledWigets';
import MessageBar from "./MessageBar";

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

const columns = {
  'knowledge': [
    { field: 'id', headerName: '行番号', flex: 0.2 },
    { field: 'in', headerName: 'IN', flex: 0.4, editable: true },
    { field: 'out', headerName: 'OUT', flex: 1, editable: true },
  ],
  'episode': [
    { field: 'id', headerName: '行番号', flex: 0.2 },
    { field: 'in', headerName: 'IN', flex: 0.4 },
    { field: 'out', headerName: 'セリフ', flex: 1, editable: true },
  ],
  'curiosity': [
    { field: 'id', headerName: '行番号', flex: 0.2 },
    { field: 'in', headerName: 'IN', flex: 0.4, editable: true },
    { field: 'out', headerName: 'OUT', flex: 1, editable: true },
  ]
};

const initialColumnVisibilityModels = {
  'knowledge': {
    id: false, in: true, out: true
  },
  'episode': {
    id: false, in: false, out: true,
  },
  'curiosity': {
    id: false, in: true, out: true,
  }
};


const isBlank = str => str.match(/^(|[ 　]+)$/) !== null;

function rows2obj(rows, kind) {

  let obj = [];


  if (kind === 'episode') {
    // episode記憶の場合は前行のOUTを今の行のINにする
    for (let i = 0, l = rows.length; i < l; i++) {
      obj[i] = {
        in: rows[i].in === "" ? rows[i - 1].out : rows[i].in,
        out: rows[i].out
      };
    }

    if (rows[0].in === "") {
      obj[0] = {
        in: '{NOP}',
        out: rows[0].out
      };
    }

  } else {
    // 他のkindではコピー
    for (let i = 0, l = rows.length; i < l; ++i) {
      obj[i] = { in: rows[i].in, out: rows[i].out }
    }
  }

  // 全てのkindで空文字やスペースのみは許可しない
  for (let i = 0, l = obj.length; i < l; i++) {

    if (isBlank(obj[i].in)) {
      return {
        state: 'error',
        message: `${i}行のINを記入してください`
      }
    }
    if (isBlank(obj[i].out)) {
      return {
        state: 'error',
        message: `${i} 行のOUTを記入してください`
      }
    }

  }

  const newObj = obj.map(item => ({
    in: item.in.split(','),
    out: item.out.split(',')
  }));

  return {
    state: 'ok',
    obj: newObj
  };
}

function obj2rows(obj) {
  const rows = obj.map(item => ({
    id: parseInt(item.id),
    in: typeof item.in === 'string' ? item.in : item.in.join(','),
    out: typeof item.out === 'string' ? item.out : item.out.join(','),
  }));
  if (rows.length !== 0) {
    return rows;
  }
  return [{ id: 0, in: "", out: "" }];
}

function maxId(rows) {
  let ids = rows.map(row => row.id);
  return Math.max(...ids);

}

export default function ScriptEditor({ partName }) {
  const bot = useContext(BiomebotContext);
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const part = bot.state.parts[partName];

  // ---------------------------------------------------
  //
  // スクリプトのロード
  //

  useEffect(() => {

    (async () => {
      setLoading(true);
      const data = await bot.loadScript(partName);
      setRows(obj2rows(data));
      setLoading(false);
    })()
  }, [bot, partName]);

  const handleCellEditCommit = useCallback(
    ({ id, field, value }) => {
      setRows(prevRows => {
        let newRows = prevRows.map(row =>
          row.id === id ? { ...row, [field]: value } : row);

        // 最終行が空行でなければ空行を追加
        const lastItem = newRows[newRows.length - 1];

        if (lastItem.in !== "" || lastItem.out !== "") {
          newRows.push({ id: maxId(prevRows) + 1, in: "", out: "" })
        }

        return newRows;
      })
    }, []
  )

  function handleSave() {
    (async () => {
      // in,outともに空白の行は削除
      let newRows = rows.filter(row => !isBlank(row.in) || !isBlank(row.out));

      setRows(newRows);

      const result = rows2obj(newRows, part.kind);
      if (result.state === 'ok') {
        console.log("result.obj",result.obj)

        await bot.save('script', result.obj, partName);
        setMessage("ok");

      } else {

        setMessage(result.message);
      }

    })()
  }

  function handleCloseMessageBar() {
    setMessage("");
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

  const dataInvalid = message.length !== 0 && message !== "ok";


  return (
    <Box
      display="flex"
      flexDirection="column"
      sx={{ margin: theme => theme.spacing(1) }}
    >
      <ItemPaper elevation={0} >
        <Box>
          <Typography variant="h5">スクリプト {partName}</Typography>
          <Typography variant="body2">カンマ(,)で区切ると値を複数設定できます</Typography>
        </Box>
        <Box>
          {description[partName]}
        </Box>

        <Box
          sx={{ height: "500px" }}
        >
          <DataGrid
            height={500}
            rows={rows}
            columns={columns[part.kind]}
            initialState={{
              columns: {
                columnVisibilityModel: initialColumnVisibilityModels[part.kind]
              }
            }}
            hideFooterSelectedRowCount
            loading={loading}
            onCellEditCommit={handleCellEditCommit}
            localeText={jaJP.components.MuiDataGrid.defaultProps.localeText}
          />
        </Box>
      </ItemPaper>
      <FabContainerBox>
        <MessageBar
          message={message}
          open={dataInvalid}
          handleClose={handleCloseMessageBar}
        />
        <Fab
          variant="extended"
          aria-label="save-script"
          onClick={handleSave}
          color="primary"
          disabled={dataInvalid}
        >
          <SaveIcon sx={{ marginRight: theme => theme.spacing(1) }} />保存
          {message === "ok" && "- ok"}
        </Fab>
      </FabContainerBox>
    </Box>
  )
}