import React from "react";
import Box from '@mui/material/Box';


export default function UserPanel(props) {
  const user = props.user;
  console.log("photourl", user.photoURL)

  return (
    <Box
      sx={{
        width: 192,
        height: 256,
      }}
      position="relative">
      <Box
        sx={{
          width: 192,
          height: 192,
          borderRadius: "100% 0% 0% 100% / 100% 100% 0% 0%",
          backgroundColor: theme => theme.palette.primary.main
        }}
        position="absolute"
        bottom={0}
        right={0}
      />
      <Box sx={{
        width: 192,
        height: 256,
      }}
        position="absolute"
        bottom={0}
        right={0}
      >
        <img
          style={{
            width: 192,
            height: 256,
          }}
          src={`/avatar/${user.photoURL}`}
          alt={user.photoURL} />
      </Box>

    </Box>

  )
}