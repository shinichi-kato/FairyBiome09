import React, { useState } from "react";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { Typography } from "@mui/material";

export default function NonNegIntegerInput({ label, description, value, handleChange }) {
  /*  非負の整数値をTextFieldから取得  */

  const [val, setVal] = useState(value);
  const [error, setError] = useState(null);

  function handleChangeValue(event) {
    let v = event.target.value;
    setVal(v);

    const fv = Number(v);

    if (Number.isNaN(fv) || fv < 0) {
      setError(true)
    } else {
      setError(null);
      handleChange(v);
    }
  }

  return (
    <>
      <Box>
        <Typography>{label}</Typography>
      </Box>
      <Box>
        <TextField
          value={val}
          onChange={handleChangeValue}
          error={error}
          helperText={error ? "0以上の整数値にしてください" : null}
        />
      </Box>
      <Box>
        <Typography variant="body2">
          {description}
        </Typography>
      </Box>
    </>
  )
}