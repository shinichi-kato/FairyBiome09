import React from "react";
import Box from '@mui/material/Box';


export default function UserPanel(props) {
  const user = props.user;
  console.log("photourl", user.photoURL)

  return (
    <Box
      sx={{
        width: 160,
        height: 240,
      }}
      position="relative">
      <Box
        sx={{
          width: 160,
          height: 160,
          borderRadius: "100% 0% 0% 100% / 100% 100% 0% 0%",
          backgroundColor: theme => theme.palette.primary.main
        }}
        position="absolute"
        bottom={0}
        right={0}
      />
      <Box sx={{
        width: 160,
        height: 240,
      }}
        position="absolute"
        bottom={0}
        right={0}
      >
        <img
          style={{
            width: 160,
            height: 240,
          }}
          src={`/avatar/${user.photoURL}`}
          alt={user.photoURL} />
      </Box>

    </Box>

  )
}