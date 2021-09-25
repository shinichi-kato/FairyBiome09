import React, { useRef, useState, useContext, useEffect } from "react";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Fab from '@mui/material/Fab';
import SaveIcon from '@mui/icons-material/SaveAlt';

import { ItemPaper, ParamSlider, FabContainerBox } from './StyledWigets';
import ColorSelector from './ColorSelector';
import PartOrder from './PartOrder';

import { BiomebotContext } from '../biomebot/BiomebotProvider';
import FactorInput from "./FactorInput";


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
    const newConfig = {
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
      await bot.save('config', newConfig);
      setMessage(' - ok');

    })()

  }

  useEffect(() => {
    let id
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
      </ItemPaper>
      <ItemPaper elevetion={0} >
        <Box>背景の色</Box>
        <Box>
          <ColorSelector
            defaultColor={config.backgroundColor}
            color={backgroundColor}
            handleChange={handleChangeBackgroundColor}
          />
        </Box>
      </ItemPaper>
      <ItemPaper elevation={0} >
        <Box>
          <Typography>チャットボットが目を覚ます時刻</Typography>
        </Box>
        <Box>
          <ParamSlider
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
          <ParamSlider
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
      </ItemPaper>
      <ItemPaper elevation={0}>
        <Box>
          <Typography>初期のメンタルレベル</Typography>
          <ParamSlider
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

      </ItemPaper>
      <ItemPaper elevation={0}>
        <Box>
          <Typography>
            初期のパート順
          </Typography>
        </Box>
        <Box>
          <PartOrder
            items={initialPartOrder}
            handleChange={handleChangeInitialPartOrder}
          />
        </Box>
        <Box>
          <Typography variant="body2">
            パートは上から順に返答するかどうかをチェックします。会話中にパートを超えて返答をしたり、順が変わったりします。
          </Typography>
        </Box>
      </ItemPaper>
      <ItemPaper elevation={0}>
        <Box>
          <Typography>
            公園でのふるまい
          </Typography>
        </Box>
        <FactorInput
          label="稼働率 0~1.00"
          value={utilization}
          handleChange={handleChangeUtilization}
          description={<>
            公園では多数のユーザとチャットボットが会話に参加するため、１対１のときよりも
            一人のチャットボットが話す割合を小さくします。チャットボットは稼働率で示す確率でのみ
            動作します。
          </>}
        />
        <FactorInput
          label="正確さ 0~1.00"
          value={precision}
          handleChange={handleChangePrecision}
          description={<>
            チャットボットは辞書に書かれた言葉がユーザの発言と似ているときに返答します。
            正確さの値を高くすると、ユーザの発言がより厳密に辞書と一致しない限りは返答しなくなります。
            正確さの値を0にすると、どのような発言に対しても「一致した」とみなして返答するようになります。
          </>}
        />
        <FactorInput
          label="持続性 0~1.00"
          value={retention}
          handleChange={handleChangeRetention}
          description={<>
            一度しゃべり始めた人は自分の話題が一段落するまで続けて話そうとします。チャットボットでその様子を
            決める数値が持続性です。持続性は次も話そうとする確率を示します。
          </>}
        />
      </ItemPaper>
      <FabContainerBox >
        <Fab
          variant="extended"
          aria-label="save"
          onClick={handleSave}
          color="primary"
        >
          <SaveIcon
            sx={{ marginRight: theme => theme.spacing(1) }}
          />保存{message}
        </Fab>
      </FabContainerBox>
    </Box>
  )
}