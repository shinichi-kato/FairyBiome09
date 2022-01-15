import React from "react";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FairyPanel from '../Panel/FairyPanel';



export default function SettingsStep(props) {
  const config = props.bot.state.config;
  const color = config.backgroundColor;
  const photoURL = config.avatarPath;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}
    >
      <Box>
        <FairyPanel
          status="ready"
          panelWidth={192}
          backgroundColor={color}
          photoURL={`/chatbot/${photoURL}/peace.svg`}
        />
      </Box>
      <Box>
        {props.bot.displayName} が仲間になりました
      </Box>
      <Box>
        <Button
          variant="contained"
          onClick={props.handleReturn}>
          OOK
        </Button>
      </Box>
    </Box>
  )
}