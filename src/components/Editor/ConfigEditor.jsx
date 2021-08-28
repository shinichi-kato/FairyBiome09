import React, { useState } from "react";
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Slider from '@material-ui/core/Slider';
import Checkbox from '@material-ui/core/Checkbox';
import Typography from '@material-ui/core/Typography';

function valuetext(value) {
  return `${value}°時`;
}

export default function ConfigEditor(props) {
  /* config Editor
   
    props.config : configデータ
    props.handleChangeConfig : 変更後のconfigデータをdbに書き込む
    編集する情報は以下の通り

    "config": {
      "description": "妖精の育て方を教えるお姉さん妖精",
      "backgroundColor": "#EEEE44",
      "circadian": {
          "wake": 6,
          "sleep": 21
      },
      "initialMentalLevel": 100,
      "initialPartOrder": [
          "greeting",
          "faq",
          "cheer",
          "peace"
      ],
      "hubBehavior": {
          "momentUpper": 10,
          "momentLower": 0,
          "precision": 0.5,
          "retention": 0.4
      }
    },
   */

  const config = props.config;
  const [circInverted, setCircInverted] = useState(false);
  const [circWake,setCircWake] = useState(config.circadian.wake);
  const [circSleep,setCircSleep] = useState(config.circadian.sleep);

  function handleChangeCircInverted(event) {
    setCircInverted(event.target.checked);
  }

  function handleChangeCircadian(event,value) {
    setCircWake(value[1]);
    setCircSleep(value[0]);
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        チャットボットの説明
      </Grid>
      <Grid item xs={12}>
        <TextField
          multiline
          rows={4}
          defaultValue={config.description}
        />
      </Grid>
      <Grid item xs={12}>
        <Typography>起きている時間帯の設定</Typography>
        <Slider
          min={0}
          max={23}
          onChange={handleChangeCircadian}
          aria-labelledby="track-inverted-range-slider"
          getAriaValueText={valuetext}
          track={circInverted ? "normal" : "inverted" }
          defaultValue={[circSleep,circWake]}
        />
        <Checkbox
          checked={circInverted}
          onChange={handleChangeCircInverted}
          label="反転する"
        />
      </Grid>
      <Grid item xs={12}>
        <Typography></Typography>
      </Grid>
    </Grid>
  )
}