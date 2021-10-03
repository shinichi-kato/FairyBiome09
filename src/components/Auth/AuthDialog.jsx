import React, { useState, useRef } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Collapse from '@mui/material/Collapse'

import EmailIcon from '@mui/icons-material/Email';
import KeyIcon from '@mui/icons-material/VpnKey';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

import AvatarSelector from './AvatarSelector';


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
      サインアウト     (props.auth.StateがOKの場合 あり)
      閉じる          (props.auth.StateがOKの場合 あり)

    編集可の項目はすべて有効な状態でないと実行ボタンが押せない

  */

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
      sx={{
        '& .MuiTextField-root': {
          '& fieldset': {
            borderRadius: '50vh',
          },
          margin: theme=>theme.spacing(1),
          width: 350,
          fontSize: 18,
          backgroundColor: '#f0f0f0',
          borderRadius: '50vh',
      }}}
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
          sx={{
            padding: theme=>theme.spacing(2),
            fontSize: 18,
            width: 350,
            borderRadius: '50vh',
          }}
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