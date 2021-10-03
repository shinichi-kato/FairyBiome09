import React, { useState } from "react";
import { navigate } from "gatsby";
import Editor from '../components/Editor/Editor';

import AuthProvider from "../components/Auth/AuthProvider";
import BiomebotProvider from '../components/biomebot/BiomebotProvider';

export default function EditPage({ location, data }) {
  /* 
    チャットルームアプリのフレームワーク

    アプリ基幹部分の状態遷移を管理。

    appState
    ---------------------------------------------------------
    'landing'       起動時はlanding状態。
    'authOk'        firebaseのauthが完了するとauthOkになり、ローカルの
                    チャットボットを探す。
    'new'           チャットボットが見つからない場合はロジック上は発生しない
                    発生しないはずだがフェイルセーフとしてcreateページに飛ぶ
    'edit    '      チャットボットが見つかり、タイトルページに「はじめから」と
                   「チャットルームに入る」が表示された状態
    'chatroom'      チャットルームが実行中
  
    IndexPageコンポーネントではroomおよびforestのログを管理し、
    他のコンポーネントがログにアクセスする手段を提供する。
  */


  const [appState, setAppState] = useState('Landing');

  function handleAuthOk() { setAppState('authOk'); }
  function handleBotFound() { setAppState('continue'); }
  function handleBotNotFound() {
    setAppState('authOk');
    navigate('/create/');
  }

  return (
    <AuthProvider
      handleAuthOk={handleAuthOk}
    >
      <BiomebotProvider
        appState={appState}
        handleBotNotFound={handleBotNotFound}
        handleBotFound={handleBotFound}
      >
        {appState === 'continue' && <Editor />}
      </BiomebotProvider>
    </AuthProvider>
  )
}
