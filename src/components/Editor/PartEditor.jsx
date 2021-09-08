import React, { useRef, useState, useContext, useEffect } from "react";
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Slider from '@material-ui/core/Slider';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import Fab from '@material-ui/core/Fab';
import SaveIcon from '@material-ui/icons/SaveAlt';

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

export default function PartEditor(props) {
  const classes = useStyles();

  const bot = useContext(BiomebotContext);

  const part = bot.state.part[props.name];

  const [name, setName] = useState(props.part);
  const [nameDuplicated, setNameDuplicated] = useState(false);
  const [kind, setKind] = useState(part.kind);
  const [momentUpper, setMomentUpper] = useState(part.mementUpper);
  const [momentLower, setMomentLower] = useState(part.mementLower);

  function handleChangeName(event) {
    const newName = event.target.value;
    setName(newName);
    setNameDuplicated(newName in bot.state.part);

  }

  const handleChangeKind = event => setKind(event.target.value);

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
            value={name}
            onChange={handleChangeName}
            error={nameDuplicated}
            helperText={nameDuplicated && "名前が他のパートと重複しています"}
          />
        </Box>
      </Paper>
      <Paper className={classes.item} elevation={0} >
        <Box>
          <Typography>種類</Typography>
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
          <TextField
            value={momentUpper}
            onChange={handleChangeMomentUpper}
          />
          <Typography>パートが反応する下限の会話温度</Typography>
          <TextField
            value={momentLowe}
            onChange={handleChangeMomentLower}
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
        <Box>
          <Typography>正確さ</Typography>
        </Box>
        <Box>
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
      </Paper>
      <Paper>

      </Paper>
    </Box>
  )
}