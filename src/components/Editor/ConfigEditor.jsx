import React, { useRef, useState, useContext, useEffect } from "react";
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Slider from '@material-ui/core/Slider';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Fab from '@material-ui/core/Fab';
import SaveIcon from '@material-ui/icons/SaveAlt';

import ColorSelector from './ColorSelector';
import PartOrder from './PartOrder';

import { BiomebotContext } from '../biomebot/BiomebotProvider';

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
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing(4),
    right: theme.spacing(4),
  },
  fabIcon: {
    marginRight: theme.spacing(1),
  },
  part: {
    background: "linear-gradient(0deg, #f0f0f0 , #ffffff)",
  },
}));

const hourMarks = [
  { value: 0, label: '0時' },
  { value: 6, label: '6時' },
  { value: 12, label: '12時' },
  { value: 18, label: '18時' },
  { value: 23, label: '23時' }
]


export default function ConfigEditor() {
  /* config Editor
   
    props.config : configデータ
    props.handleChangeConfig : 変更後のconfigデータをdbに書き込む
    編集する情報は以下の通り

    "config": {
      "description": "妖精の育て方を教えるお姉さん妖精",
      "backgroundColor": "#EEEE44",
      "avatarPath": <ー編集しない
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

  const bot = useContext(BiomebotContext);

  const config = bot.state.config;
  const descriptionRef = useRef();
  const [backgroundColor, setBackgroundColor] = useState(config.backgroundColor);
  const [wake, setWake] = useState(config.circadian.wake);
  const [sleep, setSleep] = useState(config.circadian.sleep);
  const [initialMentalLevel, setInitialMentalLevel] = useState(config.initialMentalLevel);
  const [initialPartOrder, setInitialPartOrder] = useState({ parts: config.initialPartOrder, count: 0 });
  const [utilization, setUtilization] = useState(config.hubBehavior.utilization);
  const [precision, setPrecision] = useState(config.hubBehavior.precision);
  const [retention, setRetention] = useState(config.hubBehavior.retention);

  const [message, setMessage] = useState("");

  const handleChangeBackgroundColor = (col) => setBackgroundColor(col);
  const handleChangeWake = (event, value) => setWake(value);
  const handleChangeSleep = (event, value) => setSleep(value);
  const handleChangeInitialMentalLevel = (event, value) => setInitialMentalLevel(value);
  const handleChangeInitialPartOrder = (parts) =>
    setInitialPartOrder(prevState => ({
      parts: [...parts],
      count: prevState.count + 1,  // partsの順序が変わるだけだと更新が効かないためダミーのカウンタを使う
    }));

  function handleChangeUtilization(event) {
    const value = event.target.value;
    // ここで0.0~1.00のバリデーション
    setUtilization(value);
  }

  function handleChangePrecision(event) {
    const value = event.target.value;
    // ここで0.00~1.00のバリデーション
    setPrecision(value);
  }

  function handleChangeRetention(event) {
    const value = event.target.value;
    // ここで0.0〜1.00のバリデーション
    setRetention(value);
  }

  function handleSave() {
    const config = {
      description: descriptionRef.current.value,
      backgroundColor: backgroundColor,
      avatarPath: config.avatarPath,
      circadian: {
        wake: wake,
        sleep: sleep
      },
      initialMentalLevel: initialMentalLevel,
      initialPartOrder: [...initialPartOrder.parts],
      hubBehavior: {
        utilization: parseFloat(utilization),
        precision: parseFloat(precision),
        retention: parseFloat(retention),
      }
    };

    (async () => {
      console.log("saving")
      await bot.save('config', config);
      console.log("saved")
      setMessage(' - ok');

    })()

  }

  useEffect(() => {
    if (message !== "") {
      setTimeout(() => setMessage(""), 3000);
    }
  }, [message]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      className={classes.root}
    >

      <Paper className={classes.item} elevation={0} >
        <Box>
          <Typography>チャットボットの説明</Typography>
        </Box>
        <Box>
          <TextField
            multiline
            maxRows={4}
            defaultValue={config.description}
            inputRef={descriptionRef}
            fullWidth
          />
        </Box>
        <Box>
          <Typography variant="body2">
            チャットボット新規作成時に表示される説明です。
          </Typography>
        </Box>
      </Paper>
      <Paper className={classes.item} elevetion={0} >
        <Box>背景の色</Box>
        <Box>
          <ColorSelector
            defaultColor={config.backgroundColor}
            color={backgroundColor}
            handleChange={handleChangeBackgroundColor}
          />
        </Box>
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
            value={initialMentalLevel}
            onChange={handleChangeInitialMentalLevel}
            valueLabelDisplay="on"
          />
        </Box>
        <Box>
          <Typography variant="body2">
            メンタルレベルはチャットボットの心の強さを表し、学習したり会話を続けることで少しずつ成長します。

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
          <PartOrder
            items={initialPartOrder}
            handleChange={handleChangeInitialPartOrder}
            partStyle={classes.part}
          />
        </Box>
        <Box>
          <Typography variant="body2">
            パートは上から順に返答するかどうかをチェックします。会話中にパートを超えて返答をしたり、順が変わったりします。
          </Typography>
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
          <TextField
            value={utilization}
            onChange={handleChangeUtilization}
          />
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
          <TextField
            value={precision}
            onChange={handleChangePrecision}
          />
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
          <TextField
            value={retention}
            onChange={handleChangeRetention}
          />
        </Box>
        <Box>
          <Typography variant="body2">
            一度しゃべり始めた人は自分の話題が一段落するまで続けて話そうとします。チャットボットでその様子を
            決める数値が持続性です。持続性は次も話そうとする確率を示します。
          </Typography>
        </Box>
      </Paper>
      <Box className={classes.fab}>
        <Fab
          variant="extended"
          color="primary"
          aria-label="save"
          onClick={handleSave}
        >
          <SaveIcon className={classes.fabIcon} />保存{message}
        </Fab>
      </Box>
    </Box>
  )
}