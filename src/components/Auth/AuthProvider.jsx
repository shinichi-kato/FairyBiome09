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


import loadable from '@loadable/component';
const AuthDialog = loadable(() => import('./AuthDialog'));

export const AuthContext = createContext();

function getLocalStorageItem(key, defaultValue) {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem(key, defaultValue);
  }
}

function setLocalStorageItem(key, value) {
  if (typeof window !== 'undefined') {
    return window.localStorage.setItem(key, value);
  }
}

const ERROR_MESSAGE_MAP = {
  "auth/user-not-found": "ユーザが登録されていません",
  "auth/wrong-password": "パスワードが違います",
  "auth/invalid-email": "無効なemailアドレスです",
};

const CREATEUSER_ERROR = {
  "auth/invalid-password": "パスワードは6文字以上必要です",
  "auth/email-already-exists": "このemailは登録済みです",
}

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
    authState  signOut          内容
    --------------------------------------------------------------
    notYet     no       認証前（認証できるか未確定)
        
    waiting    no       レスポンスまち
    ok         enable   認証完了
    absent              指定したユーザが存在しない
    error               認証プロセスの通信失敗他
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
        authState: 'notYet',
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

    case 'signInAndToUpdate': {
      return {
        ...state,
        user: action.user,
        authState: "notYet",
        message: "",
        page: "update"
      }
    }

    case 'createUser': {
      return {
        ...state,
        authState: "notYet",
        user: action.user,
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
        authState: "ok",
        backgroundColor: action.backgroundColor,
        page: false,
      }
    }

    case 'toSignUp': {
      return {
        ...initialState,
        page: 'signUp',
        message: action.message || ""
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

    case 'error': {
      return {
        ...state,
        message: action.message
      }
    }



    default:
      throw new Error(`invalid action ${action.type}`);
  }
}

export default function AuthPorvider(props) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const firebase = props.firebase;
  const firestore = props.firestore;

  const unsubscribeRef = useRef();

  const handleAuthOk = useRef(props.handleAuthOk);

  // ------------------------------------------------------------
  //
  // 初期化＆ユーザ認証状態のリッスン
  // ・ユーザが新規作成されたあとはdisplayNameとphotoURLが空欄。
  // その場合はサインインしてupdate画面に遷移
  // ・ユーザが未登録の場合、onAuthStateChangedが発火しないはず。
  // その場合1秒待ってsignUpに遷移
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
          if (!user.displayName || !user.photoURL) {
            dispatch({
              type: "signInAndToUpdate",
              user: user,
              backgroundColor: getLocalStorageItem(`bgColor@${user.uid}`, '#ffffff')
            });
            return;
          }
          else {
            dispatch({
              type: "signIn",
              user: user,
              backgroundColor: getLocalStorageItem(`bgColor@${user.uid}`, '#ffffff')
            });
            handleAuthOk.current();
            return;
          }

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
    const auth = getAuth();
    if (!auth.currentUser) {
      dispatch({ type: 'initialAuthTimeout' });

    }
    clearTimeout(id);
  }

  // -----------------------------------------------------------
  //
  // ユーザ新規作成
  // emailとpasswordを用い、作成が失敗した(emailが登録済み、
  // パスワードが短すぎる等)の場合入力し直しを促す
  //

  async function createUser(email, password, displayName, photoURL, bgColor) {

    dispatch({ type: 'waiting' });

    const auth = getAuth();
    const userCred = await createUserWithEmailAndPassword(auth, email, password)
      .catch(error => {
        if (CREATEUSER_ERROR[error.code]) {
          dispatch({ type: 'toSignUp', message: CREATEUSER_ERROR[error.code] });
          
        }
        else {
          renderError(error)
        }
      });

    dispatch({
      type: 'createUser',
      user: userCred.user,
    });

    setLocalStorageItem(`bgColor@${userCred.user.uid}`, '#ffffff')

  }


  // -----------------------------------------------------------
  //
  // ユーザ情報更新
  //

  async function updateUserInfo(displayName, photoURL, bgColor) {

    dispatch({ type: 'waiting' });

    const auth = getAuth();
    const user = auth.currentUser;
    setLocalStorageItem(`bgColor@${state.user.uid}`, bgColor)

    await updateProfile(user, {
      displayName: displayName,
      photoURL: photoURL
    })
      .catch(e => renderError(e));

    dispatch({
      type: "updateUserInfo",
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

    dispatch({ type: "signIn", user: userCred.user });
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

  function handleClose() {
    dispatch({ type: 'close' })
  }

  function openUpdateDialog() {
    dispatch({ type: 'toUpdate' });
  }

  //------------------------------------------------------------
  // エラーメッセージのレンダリング
  //

  function renderError(error) {
    const message = ERROR_MESSAGE_MAP[error.code] ?
      ERROR_MESSAGE_MAP[error.code]
      :
      `${error.code}: ${error.message}`
    dispatch({ type: "error", message: message });
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
