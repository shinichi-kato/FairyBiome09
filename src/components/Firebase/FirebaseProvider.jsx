import React, { useEffect, useReducer, useRef, createContext } from 'react';
import loadable from '@loadable/component';
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";

const AuthDialog = loadable(() => import('./AuthDialog'));
var undefined; // for checking undefind

export const FirebaseContext = createContext();

const initialState = {
  user: {
    displayName: "",
    email: "",
    photoURL: "",
    uid: null,
    emailVerified: null,
    providerData: null,
  },
  authState: "notYet", // notYet-run-ok-error
  message: "",
  firestore: null,
  firebaseApp: null,
  openDialog: false
};

function reducer(state, action) {
  // console.log("firebaseProvider:",action,state)
  switch (action.type) {
    case 'init': {
      return {
        ...initialState,
        firebaseApp: action.firebaseApp,
        firestore: action.firestore,
      }
    }

    case "run" : {
      return {
        ...state,
        authState: "run",
      };
    }

    case 'ok':{
      return {
        user: action.user,
        authState: "ok",
        message: "",
        openDialog: false,
        firestore: state.firestore,
        firebaseApp: state.firebaseApp,
      }
    }

    case "signOut" : {
      return {
        ...initialState,
      };
    }

    case "updateUserInfo" : {
      return {
        ...state,
        displayName: action.displayName,
        photoURL: action.photoURL,
        openDialog: false,
      };
    }

    case "error" : {
      return {
        ...initialState,
        authState: "error",
        openDialog: "signIn",
        message: action.message,
        firebaseApp: state.firebaseApp,
      };
    }

    case "openUpdateDialog":{
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

    case "closeDialog":{
      return {
        ...state,
        openDialog: false
      }
    }

    default:
      throw new Error(`invalid action ${action.type}`);
  }
}

export default function FirebaseProvider(props) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleAuthOk = useRef(props.handleAuthOk);

  // -----------------------------------------------
  //
  //   ユーザ認証関連
  //
  //
  // -----------------------------------------------

  useEffect(() => {
    let isCancelled = false;
    if(!isCancelled){

      let firebaseApp;
      if(window !== undefined){
        if(!firebase.apps.length){
          firebaseApp = firebase.initializeApp({
            apiKey: process.env.GATSBY_FIREBASE_API_KEY,
            authDomain: process.env.GATSBY_FIREBASE_AUTH_DOMAIN,
            databaseURL: process.env.GATSBY_FIREBASE_DATABASE_URL,
            projectId: process.env.GATSBY_FIREBASE_PROJECT_ID,
            storageBucket: process.env.GATSBY_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.GATSBY_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.GATSBY_FIREBASE_APP_ID,
          });
        }
        else{
          firebaseApp = firebase.app();
        }
  
        dispatch({ 
          type: "init", 
          firebaseApp: firebaseApp, 
          firestore: firebase.firestore()
        });
  
        firebaseApp.auth().onAuthStateChanged(user=>{
          if(user){
            dispatch({ type: "ok", user:user});
            handleAuthOk.current();
          } else {
            dispatch({ type: "error",message:"ユーザが認証されていません"});
          }
        })
  
      }
  
    }
    
    return () => { isCancelled = true }
  }, [state.firebaseApp]);

  function authenticate(email, password) {
    dispatch({type: "run"});

    firebase.auth().signInWithEmailAndPassword(email, password)
    .then(()=>{
      // userの更新はonAuthStateChangedで検出
    })
		.catch(error=>{
			switch (error.code) {
				case "auth/user-not-found":
					dispatch({type: "error", message: "ユーザが登録されていません"});
					break;
				case "auth/wrong-password" :
					dispatch({type: "error", message: "パスワードが違います"});
					break;
				case "auth/invalid-email" :
					dispatch({type: "error", message: "不正なemailアドレスです"});
					break;
				default:
					dispatch({type: "error", message: `${error.code}: ${error.message}`});
			}
		});
  }

  function createUser(email, password) {
    dispatch({type: "run"});
		firebase.auth().createUserWithEmailAndPassword(email, password)
		.catch(error=>{
      // 失敗したらエラーメッセージ出力
      // ※成功したらonAuthStateChangeで捕捉
			dispatch({type: "error", message: error.message});
		});
  }

  function updateUserInfo(displayName, photoURL) {
		let user = firebase.auth().currentUser;
		if (user) {
			user.updateProfile({
				displayName: displayName || user.displayName,
				photoURL: photoURL || user.photoURL
			}).then(()=>{
        // userの更新はonAuthStateChangedで捕捉するが、タイミングがUIに
        // 追いつかないため内部的にも書き換えを実行
        dispatch({
          type: "updateUserInfo",
          displayName: displayName,
          photoURL: photoURL
        });
			}).catch(error=>{
				dispatch({type: "error", message: error.code});
			});
		}
  }

  function openUpdateDialog(){
    dispatch({type:"openUpdateDialog"});
  }

  function closeAuthDialog(){

    if(state.authState==='ok'){
      dispatch({type:"closeDialog"})
    }else{
      dispatch({type:"error",message:"無効な操作です"})
    }

  }

  function signOut() {
		firebase.auth().signOut().then(()=>{
			dispatch({type: "signOut"});
		}).catch(error=>{
			dispatch({type: "error", message: error.message});
		});
  }


  return(
    <FirebaseContext.Provider
      value={{
        displayName:state.user.displayName,
        authState:state.authState,
        photoURL:state.user.photoURL,
        firestore:state.firestore,
        openUpdateDialog:openUpdateDialog,

        uid:state.user.uid,
      }}
    >
      { 
        state.openDialog !== false 
          ?
        <AuthDialog
          authState={state.authState}
          dialog={state.openDialog}
          user={state.user}
          update={state.isUpdate}
          createUser={createUser}
          authenticate={authenticate}
          signOut={signOut}
          updateUserInfo={updateUserInfo}
          handleClose={closeAuthDialog}
        />
          :
        props.children
      }
    </FirebaseContext.Provider>
  )

}
