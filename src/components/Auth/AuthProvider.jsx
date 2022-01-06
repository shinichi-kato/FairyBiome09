/* 
firebase auth provider

チャットシステムは1学級程度の規模のクローズドなコミュニティの中で運用する。
そのためにfirebaseのauthを基盤とする。

*/
import React, {
  useEffect, useReducer, useRef, createContext,
} from 'react';

import {
  getAuth, onAuthStateChanged, updateProfile, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword
} from "firebase/auth";

import useLocalStorage from '../use-localstorage';
import loadable from '@loadable/component';
const AuthDialog = loadable(() => import('./AuthDialog'));

export const AuthContext = createContext();

const initialState = {
  user: {
    displayName: "",
    email: "",
    photoURL: "",
    uid: null,
    emailVerified: null,
    providerData: null,
  },
  authState: "notYet",
  message: "",
  backgroundColor: null,
  firestore: null,
  firebaseApp: null,
  page: false,
};

function reducer(state, action) {
  /*
    state            内容
    --------------------------------------------------------------
    notYet     認証前（認証できるか未確定)
        
    waiting    レスポンスまち
    ok         認証完了
    absent     指定したユーザが存在しない
    error      認証プロセスの通信失敗他
    ---------------------------------------------------------------

    page
    ---------------------------------------------------------------
    false      非表示
    'signUp'   email, password, displayName,背景色,アイコン設定
    'signIn'   email, password入力
    'update'   displayName,背景色,アイコン設定
    ---------------------------------------------------------------

    */

  switch (action.type) {
    case 'init': {
      return {
        ...initialState,
        firebaseApp: action.firebaseApp,
        firestore: action.firestore,
      }
    }

    case 'initialAuthTimeout': {
      return {
        ...state,
        page: 'signIn'
      }
    }

    case 'waiting': {
      return {
        ...state,
        authState: 'waiting',
      }
    }

    case 'signIn': {
      return {
        ...state,
        user: action.user,
        authState: "ok",
        message: "",
        page: false,
      }
    }

    case 'createUser': {
      return {
        ...state,
        authState: "ok",
        user: action.user,
        backgroundColor: action.backgroundColor,
        page: false,
      }
    }

    case 'updateUserInfo': {
      return {
        ...state,
        user: {
          ...state.user,
          displayName: action.displayName,
          photoURL: action.photoURL,
        },
        backgroundColor: action.backgroundColor,
        page: 'update',
      }
    }

    case 'toSignUp': {
      return {
        ...initialState,
        page: 'signUp'
      }
    }

    case 'toSignIn': {
      return {
        ...state,
        page: 'signIn'
      }
    }
    
    case 'toUpdate': {
      return {
        ...state,
        page: 'update'
      }
    }

    case 'close': {
      return {
        ...state,
        page: false,
      }
    }



    default:
      throw new Error(`invalid action ${action.type}`);
  }
}

export default function AuthPorvider(props) {
  const [backgroundColor, setBackgroundColor] = useLocalStorage("userBgColor", "#FFFFFF");
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    backgroundColor: backgroundColor
  });

  const firebase = props.firebase;
  const firestore = props.firestore;

  const unsubscribeRef = useRef();

  const handleAuthOk = useRef(props.handleAuthOk);

  // ------------------------------------------------------------
  //
  // 初期化＆ユーザ認証状態のリッスン
  //

  useEffect(() => {
    if (firebase && firestore) {
      dispatch({
        type: "init",
        firebaseApp: firebase,
        firestore: firestore
      });

      const auth = getAuth();
      unsubscribeRef.current = onAuthStateChanged(auth, user => {
        if (user) {
          dispatch({
            type: "signIn",
            user: user,
          });
          handleAuthOk.current();
        } else {
          dispatch({ type: "error", message: "ユーザが認証されていません" });
        }
      });

      let id = setTimeout(() => { initialAuthTimeout(id) }, 1000);
    }

    return () => {
      if (unsubscribeRef.current) { unsubscribeRef.current(); }
    }

  }, [firebase, firestore]);

  function initialAuthTimeout(id) {
    dispatch({ type: 'initialAuthTimeout' });
    clearTimeout(id);
  }

  // -----------------------------------------------------------
  //
  // ユーザ新規作成
  // アカウント作成＋ユーザ情報更新
  //

  async function createUser(email, password, displayName, photoURL, bgColor) {

    dispatch({ type: 'waiting' });

    const auth = getAuth();
    const userCred = await createUserWithEmailAndPassword(auth, email, password)
      .catch(e => renderError(e));

    // ↑成功するとsign in そのユーザでサインインされる

    const user = auth.currentUser;

    await updateProfile(user, { displayName, photoURL })
      .catch(e => renderError(e));

    dispatch({
      type: 'createUser',
      user: userCred,
      backgroundColor: bgColor
    });

  }


  // -----------------------------------------------------------
  //
  // ユーザ情報更新
  //

  async function updateUserInfo(displayName, photoURL, bgColor) {

    dispatch({ type: 'waiting' });

    const auth = getAuth();
    const user = auth.currentUser;
    setBackgroundColor(bgColor);

    await updateProfile(user, {
      displayName: displayName,
      photoURL: photoURL
    })
      .cathc(e => renderError(e));

    dispatch({
      type: "updateuserInfo",
      displayName: displayName,
      photoURL: photoURL,
      backgroundColor: bgColor
    })
  }

  // -----------------------------------------------------------
  //
  // サインイン
  //

  async function authenticate(email, password) {

    dispatch({ type: "waiting" });

    const auth = getAuth();
    const userCred = await signInWithEmailAndPassword(auth, email, password)
      .catch(e => renderError(e));

    dispatch({ type: "signIn", user: userCred });
    handleAuthOk.current();

  }

  // ----------------------------------------------------------
  // サインアウト
  //

  async function handleSignOut() {
    const auth = getAuth();
    await signOut(auth)
      .catch(e => renderError(e));

    dispatch({ type: "toSignIn" });
  }

  //----------------------------------------------------------
  // 画面遷移
  //

  async function handleToSignUp() {
    // 一旦サインアウトしてからサインアップ
    const auth = getAuth();
    await signOut(auth)
      .catch(e => renderError(e))
    dispatch({ type: 'toSignUp' });
  }

  function handleToSignIn() {
    dispatch({ type: 'toSignIn' });
  }

  function handleClose(){
    dispatch({ type: 'close'})
  }

  function openUpdateDialog(){
    dispatch({ type: 'toUpdate'});
  }

  return (
    <AuthContext.Provider
      value={{
        displayName: state.user.displayName,
        authState: state.authState,
        photoURL: state.user.photoURL,
        backgroundColor: state.backgroundColor,
        firestore: state.firestore,
        uid: state.user.uid,
        openUpdateDialog: openUpdateDialog,
      }}
    >
      {
        state.page !== false
          ?
          <AuthDialog
            state={state}
            createUser={createUser}
            updateUserInfo={updateUserInfo}
            authenticate={authenticate}
            signOut={handleSignOut}
            toSignIn={handleToSignIn}
            toSignUp={handleToSignUp}
            close={handleClose}
          />
          :
          props.children
      }
    </AuthContext.Provider>
  )
}
