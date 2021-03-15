import React, { useContext, useEffect, useState } from "react";
import { navigate} from 'gatsby';
import { makeStyles } from '@material-ui/core/styles';
import { randomInt } from "mathjs";
import { StaticQuery, graphql } from "gatsby"
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import TextField from "@material-ui/core/TextField";
import FairyPanel from '../Panel/FairyPanel';
import { BotContext } from "./BotProvider";

var undefined;

const useStyles = makeStyles(theme => ({
  root: {
    '& .MuiTextField-root': {
      '& fieldset': {
        borderRadius: '50vh',
      },
      margin: theme.spacing(1),
      width: 350,
      fontSize: 18,
      backgroundColor: '#f0f0f0',
      borderRadius: '50vh',

    },
  },
  rootWhoseChildUsesFlexGrow: {
    width: "100%",
    height: "100vh",
    backgroundImage: "url(/images/dashboard-bg.svg)",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundPosition: "center top",
  },
  icon: {
    width: 120, // 24*x
    height: 140  // 28*x
  },
  main: {
    paddingTop: 200,
  }
}));

export default function CreateFairy() {
  const classes = useStyles();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="stretch"
      className={classes.root+" "+classes.rootWhoseChildUsesFlexGrow}
    >
      <Box
        flexGrow={1}
      >
        <Typography>
          名前をつけてください
        </Typography>
      </Box>
      <Box>
        <StaticQuery
          query={graphql`
            query {
            allFile(filter: {sourceInstanceName: {eq: "chatbot"}, ext: {eq: ".json"}}) {
              nodes {
                relativeDirectory
              }
            }
          }
        `}
          render={data => <CreateFairyComponent data={data.allFile.nodes}/>}
        ></StaticQuery>
      </Box>
    </Box>

  )
}

function CreateFairyComponent(props) {
  /* ランダムに選ばれたチャットボットを読み込んで名前をつける
    隠しコマンドで、左右矢印キーでチャットボットを選べるようにする。
    またチャットボットの画像をダブルクリックすると←→が表示され、
    クリックで同様にチャットボットが選べるようになる。
  */
  const bot = useContext(BotContext);
  const [name,setName] = useState("");

  const dir = props.data[randomInt(props.data.length)].relativeDirectory;
  
  function handleRename(){
    bot.rename(name);
    navigate('/');
  }

  function handleChange(event){
    setName(event.target.value);
  }

  useEffect(() => {
    fetch(`../../chatbot/${dir}/chatbot.json`)
      .then(res => res.json())
      .then(obj => {
        bot.generate(obj, dir);
      })
  }, [bot, dir]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="flex-start"
      alignItems="stretch"
    >
      <Box
        alignSelf="center"
      >
        <TextField
          fullWidth
          required
          placeholder="妖精の名前"
          value={name}
          onChange={handleChange}
          variant="outlined"
        />
      </Box>
      <Box
        alignSelf="center"
      >
        <Button
          variant="contained"
          onClick={handleRename}
          disabled={name.length === 0}
        >
          OK
        </Button>
      </Box>
      <Box>
        <FairyPanel photoURL={bot.photoURL}/>
      </Box>
    </Box>
  )
}