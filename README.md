FairyBiome
===========

# 概要

30人程度までのグループを想定したクローズドなチャット環境で、ユーザ一人に１つのチャットボットがあります。
ユーザはチャットボットと個別に会話や教育を行い、チャットボットを連れて他のユーザと話すことができます。
またチャット環境の中には昼夜があり、チャットボットは時間により眠っていることがあります。

# prerequisities

fairyBiomeはfirebaseをサーバーとして動作します。インストール及びデプロイにはfirebaseのプロジェクトが必要です。

googleアカウント
firebaseプロジェクト

# install 

```
npm install
```

## firebase 接続

[firebase CLIをインストールする](https://firebase.google.com/docs/cli?authuser=0#install_the_firebase_cli)を参照して`firebase`にログインする。
```
curl -sL https://firebase.tools | bash
firebase login
```

## firebaseクレデンシャルの設定

プロジェクトのルートディレクトリに .envファイルを置く。
ユーザが作成したfirebaseプロジェクトの「プロジェクトの設定」ページにある マイアプリ - SDKの設定と構成 - 構成 に表示される内容を転記しする。各項目の先頭にはGATSBY_を付加する。なおこの情報はセキュリティ情報で課金にも使用されるためリポジトリには公開しない。

```
GATSBY_FIREBASE_API_KEY=myAppApiKeyxxxxxxxxxxxxxxxxx
GATSBY_FIREBASE_AUTH_DOMAIN=myApp.firebaseapp.com
GATSBY_FIREBASE_PROJECT_ID=myApp
GATSBY_FIREBASE_STORAGE_BUCKET=myApp.xxxxxxx.com
GATSBY_FIREBASE_MESSAGING_SENDER_ID=000000000000
GATSBY_FIREBASE_APP_ID=0:00000000000:web:xxxxxxxxxxxxxxxxxxxxxxx
GATSBY_FIREBASE_MEASUREMENT_ID=x-xxxxxxxxxx
```

# ローカルでのdevelop

```
gatsby develop
```

# build & deploy

```
gatsby build
firebase deploy
```

# how to play


