import React from "react";
import Box from '@mui/material/Box';


export default function UserPanel(props) {
  const user = props.user;
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
          borderRadius: "100% 0% 0% 100% / 100% 100% 0% 0%",
          backgroundColor: theme => theme.palette.primary.main
        }}
        position="absolute"
        bottom={0}
        right={0}
      />
      <Box sx={{
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
          src={`/avatar/${user.photoURL}`}
          alt={user.photoURL} />
      </Box>

    </Box>

  )
}