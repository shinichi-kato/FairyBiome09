import React, { useState, useRef } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Collapse from '@mui/material/Collapse'

import EmailIcon from '@mui/icons-material/Email';
import PasswordIcon from '@mui/icons-material/Password';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

import AvatarSelector from './AvatarSelector';
import ColorSelector from '../Editor/ColorSelector';

const TITLE = {
  'signIn': 'サインイン',
  'signUp': 'ユーザ登録',
  'update': 'ユーザ情報の変更'
};

export default function AuthDialog(props) {
  /*
      
      page    email    password displayName photo    bgColor
      ----------------------------------------------------------
      signUp  editable editable editable    editable editable 
      update  read     read     editable    editable editable                           
      signIn  editable editable

  */

  const emailRef = useRef();
  const passwordRef = useRef();
  const displayNameRef = useRef();

  const page = props.state.page;
  const user = props.state.user;

  const [backgroundColor, setBackgroundColor] = useState(props.state.backgroundColor);
  const [photoURL, setPhotoURL] = useState(user.photoURL || "");

  function handleChangeBackgroundColor(c) {
    setBackgroundColor(c);
  }

  function handleClick() {
    switch (page) {
      case 'signIn': {
        props.authenticate(
          emailRef.current.value,
          passwordRef.current.value);
        return
      }
      case 'signUp': {
        props.createUser(
          emailRef.current.value,
          passwordRef.current.value,
          displayNameRef.current.value,
          photoURL,
          bakckgroundColor);
        return;
      }
      case 'update': {
        props.updateUserInfo(
          displayNameRef.current.value,
          photoURL,
          backgroundColor);
        return;
      }
      default:
        throw new Error(`invalid page {page}`);
    }
  }

  return (
    <Grid
      sx={{
        '& .MuiTextField-root': {
          '& fieldset': {
            borderRadius: '10px',
          },
          margin: theme => theme.spacing(1),
          width: 350,
          fontSize: 18,
          borderRadius: '10px',
          flexGrow: 1,
          backgroundColor: alpha('#ffffff', 0.2)
        },
        width: "100%",
        backgroundColor: '#78c73c',
      }}
      container
      direction="column"
      justifyContent="flex-start"
      alignItems="center"
      spacing={4}
    >
      <Grid item xs={12}>
        <Typography variant="h4">
          {TITLE[page]}
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          placeholder="メールアドレス"
          disabled={page === 'update'}
          defaultValue={user.email}
          inputRef={emailRef}
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon />
              </InputAdornment>
            )
          }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          type="password"
          placeholder="パスワード"
          defaultValue={user.password}
          disabled={page === 'update'}
          inputRef={passwordRef}
          fullWidth
          required
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PasswordIcon />
              </InputAdornment>
            )
          }}
        />
      </Grid>
      <Grid item xs={12}>
        <Collapse in={page !== 'signIn'}>
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
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountCircleIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <AvatarSelector
                photoURL={photoURL}
                handleChangePhotoURL={handleChangePhotoURL}
                handleChangeBackgroundColor={handleChangeBackgroundColor}
              />
            </Grid>
            <Grid item xs={12}>
              背景の色
              <ColorSelector
                defaultColor={backgroundColor}
                color={backgroundColor}
                handleChange={handleChangeBackgroundColor}
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
            padding: theme => theme.spacing(2),
            fontSize: 18,
            width: 350,
            borderRadius: '50vh',
          }}
          disabled={!isButtonValid}
          onClick={handleClick}
        >
          {BUTTON_TITLE[page]}
        </Button>
      </Grid>
      <Grid item xs={12}
        container
        spacing={0}
        direction="row"
        justifyContent="center"
        alignItems="flex-start"
      >
        {page !== 'signUp' &&
          <>
            <Grid item>
              <Typography>新規ユーザ登録は</Typography>
            </Grid>
            <Grid>
              <Link
                component="button"
                onClick={props.toSignUp}>
                こちら
              </Link>
            </Grid>
          </>
        }
        {page === 'signUp' &&
          <Grid item xs={12}>
            <Link
              component="button"
              onClick={props.toSignIn}>
              サインイン
            </Link>
          </Grid>
        }
      </Grid>

      <Grid item xs={12}>
        <Button
          disabled={authState === 'ok'}
          onClick={props.signOut}>
          サインアウト
        </Button>
      </Grid>
      <Grid item>
        <Button
          disabled={authState !== 'ok'}
          onClick={props.close}>
          閉じる
        </Button>
      </Grid>
    </Grid>
  )
}