import React from "react";
import Box from '@mui/material/Box';


export default function UserPanel(props) {
  const user = props.user;
  const width = props.panelWidth;
  const height = width * 1.5;
  const backgroundColor = user.backgroundColor;
  const photoURL = `${user.photoURL}/peace.svg`;

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
          backgroundColor: `${backgroundColor}`
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
          src={`/user/${photoURL}`}
          alt={photoURL} />
      </Box>

    </Box>

  )
}