import React, {useContext} from 'react';
import {navigate} from 'gatsby';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';

import FairyBiomeCrest from './fairybiome-crest.inline.svg';
import {FirebaseContext} from "../Firebase/FirebaseProvider";


const useStyles= makeStyles(theme=>({
  crest:{
    width: "100%",
    padding: theme.spacing(1),
  },
  crestContainer: {
    width: "80%",
  },
  button:{
    fontSize: 18,
    padding:theme.spacing(2),
  }
}));

export default function TitlePage(props){
  /*
  indexedDBにデータがない場合にこの画面を表示。
  はじめから：チャットボットを新たに作る
  つづきから：firestoreのデータを読む
  ログアウト：ユーザを変更

  props.isBotExistsOnFirestore がtrueの場合「つづきから」
  ボタンが有効になる。
  */
  const classes = useStyles();
  const fb = useContext(FirebaseContext);

  function toPrologue(e) {
    navigate('/content/prologue1/');
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
    >
      <Box className={classes.crestContainer}>
        <FairyBiomeCrest
          className={classes.crest}
        />
      </Box>
      { props.showMenu &&
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center">
          <Box>
            <Card className={classes.userCard}>
              <CardHeader
                avatar={
                  <Avatar
                    aria-label="user"
                    className={classes.avatar}
                    src={`../../avatar/${fb.photoURL}`} alt={fb.photoURL}/>
                }
                title={fb.displayName}
            />
              <CardContent>
                <Button onClick={fb.openUpdateDialog}>ユーザ設定を変更</Button>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Button
              className={classes.button}
              onClick={toPrologue}>はじめから</Button>
          </Box>
          { props.withContinue && 
            <Box>
              <Button className={classes.button}>つづきから</Button>
            </Box>
          }
          <Box>
            <Button>ログアウト</Button>
          </Box>
        </Box>
      }
    </Box>
  )
}