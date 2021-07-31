import React, { useState, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Link from '@material-ui/core/Link';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import Collapse from '@material-ui/core/Collapse'

import EmailIcon from '@material-ui/icons/Email';
import KeyIcon from '@material-ui/icons/VpnKey';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';

import AvatarSelector from './AvatarSelector';


const useStyles = makeStyles((theme) => ({
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
  button: {
    padding: theme.spacing(2),
    fontSize: 18,
    width: 350,
    borderRadius: '50vh',
  },
  checkbox: {
    marginLeft: theme.spacing(2)
  },
}));

const TITLE = {
  'signIn':'ユーザ認証',
  'signUp':'ユーザの新規登録',
  'update':'ユーザ情報の変更'
};
const BUTTON_TITLE={
  'signIn':'サインイン',
  'signUp':'サインアップ',
  'update':'ユーザ情報の変更'
}

export default function AuthDialog(props){
  /*
    認証ダイアログ
    
    サインイン：初期状態。ユーザが再ログインしたりIDを変更する。
    サインアップ：新規ユーザ登録。
    ユーザ情報変更：ログイン中のユーザがユーザの情報を書き換える。
            
      page           signIn      signUp      update      
      ---------------------------------------------------
      email          編集可        編集可       表示
      password       編集可        編集可       非表示
      photoURL                    編集可       編集可
      displayName                 編集可       編集可
      リンク表示       signUp      signIn      　なし
      サインアウト     (props.authStateがOKの場合 あり)
      閉じる          (props.authStateがOKの場合 あり)

    編集可の項目はすべて有効な状態でないと実行ボタンが押せない

  */

  const classes = useStyles();
  const emailRef = useRef();
  const passwordRef = useRef();
  const displayNameRef = useRef();
  const [photoURL,setPhotoURL] = useState(props.user.photoURL || "");
  const [page,setPage] = useState(props.dialog ||  'signIn');


    function handleClick(){
    switch(page) {
      case 'signIn' : {
        props.authenticate(
          emailRef.current.value,
          passwordRef.current.value);
        return
      }
      case 'signUp' : {
        props.createUser(
          emailRef.current.value,
          passwordRef.current.value);
        return;
      }
      case 'update' : {
        props.updateUserInfo(
          displayNameRef.current.value,
          photoURL );
        return;
      }
      default: 
        throw new Error(`invalid page {page}`);
    }
  }

  function handleSignOut(){
    props.handleSignOut();
  }

  function handleToSignUp(){
    setPage('signUp');
  }

  function handleToSignIn(){
    setPage('signIn');
  }

  function handleChangePhotoURL(url){
    setPhotoURL(url);
  }

  function handleClose(){
    props.handleClose();
  }

  let isButtonValid = false;
  switch(page) {
    case 'signUp': 
      if (emailRef.current?.value !== "" 
        && passwordRef.current?.value !== ""
        && displayNameRef.current?.value !== ""
        && photoURL !== "") {
          isButtonValid = true;
        }
      break;
    
      case 'signIn':
        if (emailRef.current?.value !== ""
          && passwordRef.current?.value !== ""){
            isButtonValid = true;
          }
        break;
      
      case 'update':
        if (photoURL !== "" 
        && displayNameRef.current?.value !== ""){
          isButtonValid = true;
        }
        break;
      
      default:
        throw new Error(`invalid page ${page}`);
  }

  return (
    <Grid
      className = {classes.root}
      container
      direction="column"
      justifyContent="flex-start"
      alignItems="center"
      spacing={4}
    >
      
      <Grid item xs={12}>
        <Collapse in={page==='signIn'}>
          フレーバー画像
        </Collapse>
      </Grid>
      <Grid item xs={12}>
        <Typography
          variant="h4"
        >
          {TITLE[page]}
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          placeholder="メールアドレス"
          disabled={page==='update'}
          defaultValue={props.user.email}
          inputRef={emailRef}
          variant="outlined"
          InputProps={{
            startAdornment:(
              <InputAdornment position="start">
                <EmailIcon/>
              </InputAdornment>
            )
          }}
        />
      </Grid>
      { page !== 'update' &&
        <Grid item xs={12} >
        <TextField
          type="password"
          placeholder="パスワード"
          defaultValue={props.user.password}
          inputRef={passwordRef}
          fullWidth
          required
          variant="outlined"
          InputProps={{
            startAdornment:(
              <InputAdornment position="start">
                <KeyIcon/>
              </InputAdornment>
            )
          }}
        />
      </Grid>
      }
      <Grid item xs={12}>
        <Collapse in={page!=='signIn'}>
          <Grid
            container
            direction="column"
            justifyContent="flex-start"
            alignItems="center"
            spacing={4}
          >
            <Grid item xs={12}>
              <TextField
                placeholder="名前"
                defaultValue={props.user.displayName}
                inputRef={displayNameRef}
                fullWidth
                required
                variant="outlined"
                InputProps={{
                  startAdornment:(
                    <InputAdornment position="start">
                      <AccountCircleIcon/>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <AvatarSelector 
                photoURL={photoURL}
                handleChangePhotoURL={handleChangePhotoURL}
              />
            </Grid>
          </Grid>
        </Collapse>
      </Grid>
      <Grid item xs={12}>
        <Button
          variant="contained"
          size="large"
          color="primary"
          className={classes.button}
          disabled = {!isButtonValid}
          onClick={handleClick}
        >
          { BUTTON_TITLE[page] }
        </Button>
      </Grid>
      <Grid item xs={12}
        container
        spacing={0}
        direction="row"
        justifyContent="center"
        alignItems="flex-start"        
      >
        { page === 'signIn' && 
          <>
            <Grid item>
              <Typography>新規ユーザ登録は</Typography>
            </Grid>
            <Grid>
              <Link 
                component="button"
                onClick={handleToSignUp}>
                こちら
              </Link>
            </Grid>
          </>
        }
        { page === 'signUp' &&
          <Grid item xs={12}>
            <Link
              component="button"
              onClick={handleToSignIn}>
                サインイン
            </Link>
          </Grid>
        }
      </Grid>

      <Grid item xs={12}>
        <Button
          disabled={props.authState!=='ok'}
          onClick={handleSignOut}>
            サインアウト
        </Button>
      </Grid>
        <Grid item>
        <Button
          disabled={props.authState!=='ok'}
          onClick={handleClose}>
            閉じる
        </Button>
      </Grid>       
    </Grid>

  )

}