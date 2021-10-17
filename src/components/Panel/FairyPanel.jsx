import React from "react";
import Box from '@mui/material/Box';


export default function FairyPanel(props) {
  const width = props.panelWidth;
  const height = width * 1.5;
  
  return (

    <Box
      sx={{
        width: width,
        height: height,
      }}
      position="relative">
      <Box
        sx={{
          width: width,
          height: width,
          borderRadius: "0% 100% 100% 0% / 100% 100% 0% 0%",
          backgroundColor: theme=>theme.palette.primary.main
        }}
        position="absolute"
        bottom={0}
        left={0}
      />
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

    </Box>

  )
}