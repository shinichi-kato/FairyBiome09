import React, { useState, useContext, useEffect } from "react";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Fab from '@mui/material/Fab';
import Button from '@mui/material/Button';
import SaveIcon from '@mui/icons-material/SaveAlt';

import { ItemPaper, ParamSlider, FabContainerBox } from './StyledWigets';
import { BiomebotContext } from '../biomebot/BiomebotProvider';

import FactorInput from './FactorInput';
import AvatarSelector from './AvatarSelector';


export default function PartEditor(props) {
  /*
    パートの編集
    パートが優先になったときにチャット画面上に表示されるアバターは
    {パート名}.svgとなる。見つからなかった場合はdefault.svgが使われる
  */
  const bot = useContext(BiomebotContext);

  const part = bot.state.parts[props.partName];

  const [partName, setPartName] = useState(props.partName);
  const [nameDuplicated, setNameDuplicated] = useState(false);
  const [kind, setKind] = useState(part.kind);
  const [avatar, setAvatar] = useState(part.avatar);

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

  }

  const handleChangeKind = event => setKind(event.target.value);
  const handleChangeAvatar = x => setAvatar(x);
  const handleChangeMomentUpper = (evnet, value) => setMomentUpper(value);
  const handleChangeMomentLower = (event, value) => setMomentLower(value);
  const handleChangePrecision = value => setPrecision(value);
  const handleChangeRetention = value => setRetention(value);

  function handleToScript() {
    props.handleChangePage('script', props.partName);
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
        avatar: avatar,
        momentUpper: momentUpper,
        momentLower: momentLower,
        precision: precision,
        retention: retention,
      }
    };

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
      sx={{ margin: theme => theme.spacing(1) }}
    >
      <ItemPaper elevation={0} >
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
            パートの名前は変更できます。他のパートと同じ名前は使えません。
          </Typography>
        </Box>
      </ItemPaper>
      <ItemPaper elevation={0}>
        <Box>
          <Typography variant="h5">
            表示するキャラクタ
          </Typography>
        </Box>
        <Box>
          <AvatarSelector
            avatarDir={bot.state.config.avatarPath}
            avatar={avatar}
            handleChangeAvatar={handleChangeAvatar}
            avatarList={props.avatarList}
          />
        </Box>
      </ItemPaper>
      <ItemPaper elevation={0} >
        <Button
          variant="outlined"
          disabled={partName !== props.partName}
          onClick={handleToScript}
        >
          スクリプトの編集
        </Button>
        <Typography variant="body2">
          辞書を編集します。パートの名前を変更する場合は先にこの画面の保存ボタンを押してください。
        </Typography>
      </ItemPaper>
      <ItemPaper elevation={0} >
        <Box>
          <Typography>パートの返答方式</Typography>
        </Box>
        <Box>
          <form>
            <RadioGroup aria-label="kind" name="kind" value={kind} onChange={handleChangeKind}>
              <FormControlLabel value="knowledge" control={<Radio />} label="【辞書型】用意した辞書にある言葉に対して決まった返事を返す" />
              <FormControlLabel value="curiosity" control={<Radio />} label="【好奇心型】知らない言葉を言われたらそれを聞き返して覚える" />
              <FormControlLabel value="episode" control={<Radio />} label="【エピソード型】昔のやり取りをなぞって返答する" />
            </RadioGroup>
          </form>
        </Box>
      </ItemPaper>
      <ItemPaper elevation={0} >
        <Box>
          <Typography>パートが反応する上限の会話温度</Typography>
          <ParamSlider
            min={0} max={100}
            step={1}
            value={momentUpper}
            onChange={handleChangeMomentUpper}
            valueLabelDisplay="on"
          />
          <Typography>パートが反応する下限の会話温度</Typography>
          <ParamSlider
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
      </ItemPaper>

      <FabContainerBox>
        <Fab
          variant="extended"
          aria-label="save"
          onClick={handleSave}
          color="primary"
        >
          <SaveIcon sx={{ marginRight: theme => theme.spacing(1), }} />保存{message}
        </Fab>
      </FabContainerBox>
    </Box>
  )
}