import React, { useState } from "react";
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Button from '@material-ui/core/Button';


export default function ParamEditor(props) {
  const [rate, setRate] = useState(props.changeRate);
  const [message, setMessage] = useState("");

  function handleChangeRate(e) {
    setRate(e.target.value);
  }
  function handleClick() {
    const v = parseFloat(rate);
    if (isNaN(v)) {
      setMessage("浮動小数点の値を入力してください");
    } else {
      props.handleChangeChangeRate(v);
    }

  }

  return (
    <FormControl>
      <Grid container spacing={2}>
        <Grid item xs={5}>
          乱数シード
        </Grid>
        <Grid item xs={7}>
          {props.randomSeed}
        </Grid>
        <Grid item xs={3}>
          天候変化速度
        </Grid>
        <Grid item xs={6}>
          <TextField
            id="change-rate"
            value={rate}
            onChange={handleChangeRate}
            variant="outlined"
            helperText={message}
          />
          天候変化速度を反映するにはgatsby-configを編集してください
        </Grid>
        <Grid item xs={3}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleClick}>
            変更
          </Button>
        </Grid>
      </Grid>
    </FormControl>

  )
}