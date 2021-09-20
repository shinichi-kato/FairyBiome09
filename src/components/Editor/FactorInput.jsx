import React, { useState } from "react";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { Typography } from "@mui/material";

export default function FactorInput(props) {
  /*  0〜1.00の数値をTextFieldから取得
      props.lebel,
      props.description 
      props.value,
      props.handleChange
      */

  const [value, setValue] = useState(props.value);
  const [helperText, setHelperText] = useState(null);

  function handleChange(event) {
    let v = event.target.value;
    setValue(v);

    const fv = Number(v);
    
    if (Number.isNaN(fv) || (fv < 0 || 1 < fv)) {
      setHelperText("0.00〜1.00の数値にしてください")
    } else {
      setHelperText(null);
      props.handleChange(v);
    }
  }


  return (
    <>
      <Box>
        <Typography>{props.label}</Typography>
      </Box>
      <Box>
        <TextField
          value={value}
          onChange={handleChange}
          error={helperText !== null}
          helperText={helperText}
        />
      </Box>
      <Box>
        <Typography variant="body2">
          {props.description}
        </Typography>
      </Box>
    </>
  )
}