import React, { useState, useContext, useEffect } from "react";
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Slider from '@material-ui/core/Slider';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Fab from '@material-ui/core/Fab';
import Button from '@material-ui/core/Button';
import SaveIcon from '@material-ui/icons/SaveAlt';

import { BiomebotContext } from '../biomebot/BiomebotProvider';

import FactorInput from './FactorInput';

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

const builtInMoods = {
  'cheer': true, 'down': true, 'greeting': true, 'peace': true, 'sleepy': true, 'wake': true
};


export default function PartEditor(props) {
  const classes = useStyles();

  const bot = useContext(BiomebotContext);

  const part = bot.state.parts[props.partName];

  const [partName, setPartName] = useState(props.partName);
  const [nameDuplicated, setNameDuplicated] = useState(false);
  const [kind, setKind] = useState(part.kind);
  const [initialMood, setInitialMood] = useState(
    partName in builtInMoods ? partName : (part.initialMood || "peace")
  );
  const moodIsBuiltIn = partName in builtInMoods;

  const [momentUpper, setMomentUpper] = useState(part.momentUpper);
  const [momentLower, setMomentLower] = useState(part.momentLower);
  const [precision, setPrecision] = useState(part.precision);
  const [retention, setRetention] = useState(part.retention);
  const [message, setMessage] = useState();

  function handleChangePartName(event) {
    const newName = event.target.value;
    setPartName(newName);
    if (props.partName !== newName) {
      setNameDuplicated(newName in bot.state.parts);
    }

    if (newName in builtInMoods) {
      setInitialMood(newName);
    }

  }

  const handleChangeKind = event => setKind(event.target.value);
  const handleChangeInitialMood = event => setInitialMood(event.target.value);
  const handleChangeMomentUpper = (evnet, value) => setMomentUpper(value);
  const handleChangeMomentLower = (event, value) => setMomentLower(value);
  const handleChangePrecision = value => setPrecision(value);
  const handleChangeRetention = value => setRetention(value);

  function handleToScript(){
    props.handleChangePage('script',props.partName);
  }

  function handleSave() {
    /*
      パートの名前が変更された場合、古い方のパートは削除して
      入れ替える。
    */
    const newPartData = {
      newName: partName,
      prevName: props.partName,
      data: {
        kind: kind,
        initialMood: initialMood,
        momentUpper: momentUpper,
        momentLower: momentLower,
        precision: precision,
        retention: retention,

      }
    }

      (async () => {
        await bot.save('part', newPartData);
        setMessage(' - ok');

      })()

  }

  useEffect(() => {
    let id;
    if (message !== "") {
      id = setTimeout(() => setMessage(""), 3000);
    }
    return () => {
      clearTimeout(id);
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
          <Typography variant="h5">
            パート
          </Typography>
        </Box>
        <Box>
          名前：
          <TextField
            value={partName}
            onChange={handleChangePartName}
            error={nameDuplicated}
            helperText={nameDuplicated && "名前が他のパートと重複しています"}
          />
        </Box>
        <Box>
          <Typography variant="body2">
            パートの名前は変更できます。他のパートと同じ名前は使えません
          </Typography>
        </Box>
      </Paper>
      <Paper className={classes.item} elevation={0}>
        <Box>
          <Typography>開始時のムード</Typography>
        </Box>
        <Box>
          <form>
            <RadioGroup aria-label="initial-mood" name="initialMood" value={initialMood} onChange={handleChangeInitialMood}
            >
              <FormControlLabel value="peace" control={<Radio />} label="peace (落ち着いている)" disabled={moodIsBuiltIn} />
              <FormControlLabel value="cheer" control={<Radio />} label="cheer (盛り上がっている" disabled={moodIsBuiltIn} />
              <FormControlLabel value="down" control={<Radio />} label="down (落ち込んでいる)" disabled={moodIsBuiltIn} />
              <FormControlLabel value="greeting" control={<Radio />} label="greeting (挨拶)" disabled={moodIsBuiltIn} />
              <FormControlLabel value="wake" control={<Radio />} label="wake (目がさめたところ)" disabled={moodIsBuiltIn} />
              <FormControlLabel value="sleepy" control={<Radio />} label="sleepy (眠そう)" disabled={moodIsBuiltIn} />
            </RadioGroup>
          </form>
        </Box>
        <Box>
          <Typography variant="body2">
            このパートが返答をし始めた時に使われる表情です。
            パートの名前がこれらのどれかと同じ場合は変更できません。
          </Typography>
        </Box>
      </Paper>
      <Paper className={classes.item} elevation={0} >
        <Box>
          <Typography>パートの返答方式</Typography>
        </Box>
        <Box>
          <form>
            <RadioGroup aria-label="kind" name="kind" value={kind} onChange={handleChangeKind}>
              <FormControlLabel value="knowledge" control={<Radio />} label="用意した辞書にある言葉に対して決まった返事を返す" />
              <FormControlLabel value="episode" control={<Radio />} label="言われた言葉で昔のやり取りを思い出してしゃべる" />
              <FormControlLabel value="curiosity" control={<Radio />} label="知らない言葉を言われたらそれを聞き返して覚える" />
            </RadioGroup>
          </form>
        </Box>
      </Paper>
      <Paper className={classes.item} elevation={0} >
        <Box>
          <Typography>パートが反応する上限の会話温度</Typography>
          <Slider
            className={classes.slider}
            min={0} max={100}
            step={1}
            value={momentUpper}
            onChange={handleChangeMomentUpper}
            valueLabelDisplay="on"
          />
          <Typography>パートが反応する下限の会話温度</Typography>
          <Slider
            className={classes.slider}
            min={0} max={100}
            step={1}
            value={momentLower}
            onChange={handleChangeMomentLower}
            valueLabelDisplay="on"
          />
        </Box>
        <Box>
          <Typography variant="body2">
            挨拶は、やり取りが始まったばかりの「会話が温まっていない」ときにだけ
            行われる一方、趣味の話などはやり取りが盛り上がって「会話が温まった」ときに
            行われます。パートにごとにその「温度範囲」を設定します。
            この値は0から始まり、やり取りを重ねると大きくなっていきます。
          </Typography>
        </Box>

        <FactorInput
          label="正確さ"
          value={precision}
          handleChange={handleChangePrecision}
          description={
            <>
              チャットボットは辞書に書かれた言葉がユーザの発言と似ているときに返答します。
              正確さの値を高くすると、ユーザの発言がより厳密に辞書と一致しない限りは返答しなくなります。
              正確さの値を0にすると、どのような発言に対しても「一致した」とみなして返答するようになります。
            </>
          }
        />
        <FactorInput
          label="継続性"
          value={retention}
          handleChange={handleChangeRetention}
          description={
            <>
              一度しゃべり始めた人は自分の話題が一段落するまで続けて話そうとします。チャットボットでその様子を
              決める数値が持続性です。持続性は次も話そうとする確率を示します。
            </>
          }
        />
      </Paper>
      <Paper className={classes.item} elevation={0} >
        <Button
          variant="outlined"
          color="primary"
          disabled={partName != props.partName}
          onClick={handleToScript}
        >
          スクリプトの編集
        </Button>
        <Typography variant="body2">
          辞書を編集します。パートの名前を変更する場合は先にこの画面の保存ボタンを押してください。
        </Typography>
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