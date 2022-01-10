import React from "react";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { alpha } from '@mui/material/styles';
import ColorSelector from '../Editor/ColorSelector';
import Button from '@mui/material/Button';



export default function SettingsStep(props) {
  return (
    <>
      <Box
        sx={{
          '& .MuiTextField-root': {
            '& fieldset': {
              borderRadius: '10px',
            },
            margin: theme => theme.spacing(1),
            width: 350,
            fontSize: 18,
            borderRadius: '10px',
            flexGrow: 1,
            backgroundColor: alpha('#ffffff', 0.2)
          },
          width: "100%",
        }}>
        <TextField
          fullWidth
          required
          placeholder="名前"
          value={props.botName}
          onChange={props.handleChangeBotName}
          variant="outlined"
        />
      </Box>
      <Box>
        <ColorSelector
          defaultColor={props.defaultColor}
          color={props.color}
          handleChange={props.handleChangeColor}
        />
      </Box>
      <Box>
        <Button
          variant="contained"
          color="primary"
          onClick={props.handleNext}>
          OK
        </Button>
      </Box>
      <Box>
        <Button
          onClick={props.handlePrev}>
          戻る
        </Button>
      </Box>
    </>
  )
}