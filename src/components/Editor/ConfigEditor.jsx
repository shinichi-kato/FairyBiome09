import React, { useState } from "react";
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Slider from '@material-ui/core/Slider';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';

const useStyles = makeStyles((theme) => ({
  root: {
    margin: theme.spacing(1),
  },
  item: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
  },
  slider: {
    marginTop: 50,
    width: 350,
    marginLeft: 40,
  }
}));

const hourMarks = [
  { value: 0, label: '0時' },
  { value: 6, label: '6時' },
  { value: 12, label: '12時' },
  { value: 18, label: '18時' },
  { value: 23, label: '23時' }
]

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
          "utilization": 0.7,
          "precision": 0.5,
          "retention": 0.4
      }
    },
   */

  const classes = useStyles();
  const config = props.config;
  const [wake, setWake] = useState(config.circadian.wake);
  const [sleep, setSleep] = useState(config.circadian.sleep);
  const [initialMentalLevel, setInitialMentalLevel] = useState(config.initialMentalLevel);
  const [initialPartOrder, setinitialPartOrder] = useState(config.initialPartOrder)

  function handleChangeWake(event, value) {
    setWake(value);
  }

  function handleChangeSleep(event, value) {
    setSleep(value);
  }

  function handleChangeInitialMentalLevel(event, value) {
    setInitialMentalLevel(value);
  }


  return (
    <Box
      display="flex"
      flexDirection="column"
      className={classes.root}
    >

      <Paper className={classes.item} elevation={0} >
        チャットボットの説明
        <TextField
          multiline
          maxRows={4}
          defaultValue={config.description}
          fullWidth
        />
      </Paper>
      <Paper className={classes.item} elevation={0} >
        <Box>
          <Typography>チャットボットが目を覚ます時刻</Typography>
        </Box>
        <Box>
          <Slider
            className={classes.slider}
            min={0} max={23}
            step={1}
            value={wake}
            onChange={handleChangeWake}
            valueLabelDisplay="on"
            track={false}
            marks={hourMarks}
          />
        </Box>
        <Box>
          <Typography>チャットボットが眠る時刻</Typography>
        </Box>
        <Box>
          <Slider
            className={classes.slider}
            min={0} max={23}
            step={1}
            value={sleep}
            onChange={handleChangeSleep}
            valueLabelDisplay="on"
            track={false}
            marks={hourMarks}
          />
        </Box>
        <Box>
          <Typography variant="body2">
            チャットボットは眠っている間ユーザに返事をしなくなります。
          </Typography>
        </Box>
      </Paper>
      <Paper className={classes.item} elevation={0}>
        <Box>
          <Typography>初期のメンタルレベル</Typography>
          <Slider
            className={classes.slider}
            min={0} max={100}
            step={1}
            valueDisplay="on"
            value={initialMentalLevel}
            onChange={handleChangeInitialMentalLevel}
            valueLabelDisplay="on"
          />
        </Box>
        <Box>
          <Typography variant="body2">
            メンタルレベルはチャットボットの心の強さを表し、学習したり会話を続けることで少しずつ上昇します。

          </Typography>
        </Box>

      </Paper>
      <Paper className={classes.item} elevation={0}>
        <Box>
          <Typography>
            初期のパート順
          </Typography>
        </Box>
        <Box>

        </Box>
      </Paper>
      <Paper className={classes.item} elevation={0}>
        <Box>
          <Typography>
            公園でのふるまい
          </Typography>
        </Box>
        <Box>
          <Typography>稼働率 0~100</Typography>
          <TextField />
        </Box>
        <Box>
          <Typography variant="body2">
            公園では多数のユーザとチャットボットが会話に参加するため、１対１のときよりも
            一人のチャットボットが話す割合を小さくします。チャットボットは稼働率で示す確率でのみ
            動作します。
          </Typography>
        </Box>
        <Box>
          <Typography>正確さ</Typography>
          <TextField/>
        </Box>
        <Box>
          <Typography variant="body2">
            チャットボットは辞書に書かれた言葉がユーザの発言と似ているときに返答します。
            正確さの値を高くすると、ユーザの発言がより厳密に辞書と一致しない限りは返答しなくなります。
            正確さの値を0にすると、どのような発言に対しても「一致した」とみなして返答するようになります。
            
          </Typography>
        </Box>
        <Box>
          <Typography>持続性 0〜100</Typography>
          <TextField />
        </Box>
        <Box>
          <Typography variant="body2">
            一度しゃべり始めた人は自分の話題が一段落するまで続けて話そうとします。チャットボットでその様子を
            決める数値が持続性です。持続性は次も話そうとする確率を示します。
          </Typography>
        </Box>
      </Paper>

    </Box>
  )
}