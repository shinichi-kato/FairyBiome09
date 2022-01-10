import React from "react";
import Box from '@mui/material/Box';
import WarningIcon from '@mui/icons-material/Warning';
import Button from '@mui/material/Button';

export default function ContinueStep(props) {
  return (
    <>
      <Box>
        <WarningIcon
          style={{
            color: "#faa475",
            fontSize: 60
          }}
        />
      </Box>
      <Box>
        すでに妖精{props.displayName}のデータがあります。<br />
        新しく妖精を作ると{props.displayName}は消滅します。<br />
        よろしいですか？
      </Box>
      <Box>
        <Button
          variant="contained"
          onClick={props.handleAccept}>
          今の妖精を消して新しい妖精を作る
        </Button>
      </Box>
      <Box>
        <Button
          onClick={props.handleReturn}
        >
          中止
        </Button>
      </Box>
    </>
  )
}