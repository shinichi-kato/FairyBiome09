import React from "react";
import Box from '@mui/material/Box';


export default function FairyPanel(props) {
  /*
    fairyのavatarと背景を表示する。
    props.status | 説明
  ---------------|----------
  unload         | 透明
  loaded         | 灰色の背景のみ
  deploying      | 色付きの背景のみ
  ready          | 色付きの背景＋avatar
  */

  const status = props.status;
  const width = props.panelWidth;
  const height = width * 1.5;

  let bgColor = props.backgroundColor;
  if (status === 'loaded') {
    bgColor = '#DDDDDD';
  } else if (status === 'unload') {
    bgColor = '#00000000';
  }

  
  return (
    <Box
      sx={{
        width: width,
        height: height,
        position: "relative"
      }}
      >
      <Box
        sx={{
          width: width,
          height: width,
          borderRadius: "0% 100% 100% 0% / 100% 100% 0% 0%",
          backgroundColor: bgColor,
          position: "absolute",
          bottom:0,
          left:0,
        }}
      />
      {(status === 'ready' || status === 'loaded') &&
        <Box
          sx={{
            width: width,
            height: height,
          }}
          position="absolute"
          bottom={0}
          right={0}
        >
          <img
            style={{
              width: width,
              height: height,
            }}
            src={props.photoURL}
            alt="" />
        </Box>
      }
    </Box>
  )
}