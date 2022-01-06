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
  bakckgroundColor: null,
  firestore: null,
  firebaseApp: null,
  openDialog: false
};

function reducer(state, action) {
  /*
  state            内容
  ----------------------------------------------------------
  notYet           認証前（認証できるか未確定)
  signUpDialog     ユーザ新規作成画面。email,passwordに加え
                   ユーザ名、アイコン、背景色を設定
  signUpRequsting  ユーザ作成を要求中。成功したらokへ
  signInDialog     認証情報入力画面。emailとpassword。
  signInReqeusting 認証を要求中。成功したらokへ
  updateDialog     ユーザ情報変更画面
                   ユーザ名、アイコン、背景色を設定
  updateRequesting ユーザ情報変更を要求中。成功したらokへ
  ok               認証完了
  error            ユーザ認証失敗
  ---------------------------------------------------------

  
  */
  switch (action.type) {
    case 'init': {
      return {
        ...initialState,
        firebaseApp: action.firebaseApp,
        firestore: action.firestore,
      }
    }

    case "run": {
      return {
        ...state,
        authState: "run",
      };
    }

    case 'ok': {
      const authState =
        !action.backgroundColor || action.user.displayName === "update" ? '' : 'ok';
      return {
        user: action.user,
        authState: authState,
        message: "",
        backgroundColor: state.backgroundColor,
        openDialog: false,
        firestore: state.firestore,
        firebaseApp: state.firebaseApp,
      }
    }

    case "signOut": {
      return {
        ...initialState,
        openDialog: "signUp",
      };
    }

    case "updateUserInfo": {
      return {
        ...state,
        displayName: action.displayName,
        backgroundColor: action.backgroundColor,
        photoURL: action.photoURL,
        openDialog: false,
      };
    }

    case "error": {
      return {
        ...initialState,
        authState: "error",
        openDialog: "signIn",
        message: action.message,
        firebaseApp: state.firebaseApp,
      };
    }

    case "openUpdateDialog": {
      return {
        ...state,
        openDialog: "update",
      }
    }

    case "openDialog": {
      return {
        ...state,
        openDialog: "signIn"
      }
    }

    case "closeDialog": {
      return {
        ...state,
        openDialog: false
      }
    }

    default:
      throw new Error(`invalid action ${action.type}`);
  }
}

export default function AuthProvider(props) {
  const [backgroundColor, setBackgroundColor] = useLocalStorage("userBgColor","#FFFFFF");
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    backgroundColor: backgroundColor
  });

  const firebase = props.firebase;
  const firestore = props.firestore;

  const unsubscribeRef = useRef();

  const handleAuthOk = useRef(props.handleAuthOk);

  // -----------------------------------------------
  //
  //   ユーザ認証とfirestoreのListen
  //
  //
  // -----------------------------------------------

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
            type: "ok",
            user: user,
          });
          handleAuthOk.current();
        } else {
          dispatch({ type: "error", message: "ユーザが認証されていません" });
        }
      })

    }

    return () => {
      if (unsubscribeRef.current) { unsubscribeRef.current(); }
    }

  }, [firebase, firestore]);


  function authenticate(email, password) {
    dispatch({ type: "run" });
    const auth = getAuth();
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        dispatch({
          type: "ok",
          user: userCredential.user,
        });
        handleAuthOk.current();
      })
      .catch(error => {
        switch (error.code) {
          case "auth/user-not-found":
            dispatch({ type: "error", message: "ユーザが登録されていません" });
            break;
          case "auth/wrong-password":
            dispatch({ type: "error", message: "パスワードが違います" });
            break;
          case "auth/invalid-email":
            dispatch({ type: "error", message: "不正なemailアドレスです" });
            break;
          default:
            dispatch({ type: "error", message: `${error.code}: ${error.message}` });
        }
      });
  }

  function createUser(email, password) {
    dispatch({ type: "run" });
    const auth = getAuth();
    createUserWithEmailAndPassword(auth, email, password)
      .then(userCredential => {
        dispatch({
          type: "ok",
          user: userCredential.user,
        });
        handleAuthOk.current();
      })
      .catch(error => {
        // 失敗したらエラーメッセージ出力
        // ※成功したらonAuthStateChangeで捕捉
        dispatch({ type: "error", message: error.message });
      });
  }

  function updateUserInfo(displayName, photoURL, bgColor) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setBackgroundColor(bgColor);
      updateProfile(user, {
        displayName: displayName || user.displayName,
        photoURL: photoURL || user.photoURL
      }).then(() => {
        // userの更新はonAuthStateChangedで捕捉するが、タイミングがUIに
        // 追いつかないため内部的にも書き換えを実行
        dispatch({
          type: "updateUserInfo",
          displayName: displayName,
          photoURL: photoURL,
          backgroundColor: bgColor,
        });
      }).catch(error => {
        dispatch({ type: "error", message: error.code });
      });
    }
  }

  function openUpdateDialog() {
    // dispatchするだけなのでuseCallback化しない
    dispatch({ type: "openUpdateDialog" });
  }

  function closeAuthDialog() {

    if (state.authState === 'ok') {
      dispatch({ type: "closeDialog" })
    } else {
      dispatch({ type: "error", message: "無効な操作です" })
    }

  }

  function handleSignOut() {
    const auth = getAuth();
    signOut(auth).then(() => {
      dispatch({ type: "signOut" });
    }).catch(error => {
      dispatch({ type: "error", message: error.message });
    });
  }




  return (
    <AuthContext.Provider
      value={{
        displayName: state.user.displayName,
        authState: state.authState,
        photoURL: state.user.photoURL,
        backgroundColor: state.backgroundColor,
        firestore: state.firestore,
        openUpdateDialog: openUpdateDialog,
        uid: state.user.uid,
      }}
    >
      {
        state.openDialog !== false
          ?
          <AuthDialog
            authState={state.authState}
            dialog={state.openDialog}
            user={state.user}
            backgroundColor={state.backgroundColor}
            update={state.isUpdate}
            createUser={createUser}
            authenticate={authenticate}
            handleSignOut={handleSignOut}
            updateUserInfo={updateUserInfo}
            handleClose={closeAuthDialog}
          />
          :
          props.children
      }
    </AuthContext.Provider>
  )

}
