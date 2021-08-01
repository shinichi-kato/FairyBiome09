FairyBiome
===========

# 概要

30人程度までのグループを想定したクローズドなチャット環境で、ユーザ一人に１つのチャットボットがあります。
ユーザはチャットボットと個別に会話や教育を行い、チャットボットを連れて他のユーザと話すことができます。
またチャット環境の中には昼夜があり、チャットボットは時間により眠っていることがあります。

# prerequisities

googleアカウント
firebaseプロジェクト

# install 

```
npm install
```

## firebaseクレデンシャルの設定

プロジェクトのルートディレクトリに .envファイルを置く。
内容はユーザが作成したfirebaseプロジェクトの「プロジェクトの設定」ページにある マイアプリ - SDKの設定と構成 - 構成 に表示されるものを転記する。なおこの情報はセキュリティ情報で課金にも使用されるためリポジトリには公開しない。

```
GATSBY_FIREBASE_API_KEY=myAppApiKeyxxxxxxxxxxxxxxxxx
GATSBY_FIREBASE_AUTH_DOMAIN=myApp.firebaseapp.com
GATSBY_FIREBASE_PROJECT_ID=myApp
GATSBY_FIREBASE_STORAGE_BUCKET=myApp.xxxxxxx.com
GATSBY_FIREBASE_MESSAGING_SENDER_ID=000000000000
GATSBY_FIREBASE_APP_ID=0:00000000000:web:xxxxxxxxxxxxxxxxxxxxxxx
FIREBASE_MEASUREMENT_ID=x-xxxxxxxxxx
```