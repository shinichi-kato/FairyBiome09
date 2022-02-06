debug note
==============

参考リンク
https://stackoverflow.com/questions/64259890/react-usecontext-value-is-not-updated-in-the-nested-function


1. チャットルーム

* dialogで一定時間会話しなかったら会話終了とみなす
* 会話が始まっていない場合挨拶を発火させる
* ボットの精神パワー実装
* ボットの返答にディレイをかける
* ボットを新しくしてもローカルのログが残る
* 公園で全員の吹き出しが白い

2. エディタ
* スクリプトをdbio.loadScriptでnextの順に並べてデータ取得
* どんな{}が展開されるのかユーザにわからない
* json形式でのインポート
* json形式でのエクスポート

3. create
* systemのボットとfirestoreのボットの区別


4. 他
* landing画面でユーザとボットのアバター表示
* AuthDialogでサインアップができない

* etimatorがconfig内に書かれてindexDBに保存されている。要除去
* /editを直でアクセスすると真っ白ー＞BiomebotProviderでhandleBotFound()が呼ばれてるかチェックすること



# 以下対応済み
* idが初期に非表示にならない -> DataGridにもともと機能があった
* {bot}がundefined
* 最終行が空白かどうか、見た目わかりにくい -> /^( |[ 　]+)$/は無効とみなす
* ぼっと選択画面でタイムスタンプも表示
* チャットボットのスクリプトがfirestoreに保存されていない
* 再入室するとdialog.js:209でSendMessage is not a functionになる
* chatroom.jsx:152でprops.writeLogを正しくuseEffectに渡せていない
* forest のrandomloadでコケる
* botをindexedDBに保存したときにavatarPathにuidが代入される
* 森に入ったときに出現するチャットボットの決定ロジック
* firestoreへのsaveでエラー
* チャットボットをテンプレートから新規作成したときには名前と背景色を設定
* チャットボット選択画面で一つのボットを選択できない
* チャットボットを新規作成するときにfirestoreからもロード可能に
* 部屋と公園ではチャットボットがロードされるがforestではされない
* 誰もいない森から帰ってきたあと、自分のチャットボットが戻らない

* チャットボットのdeployが完了するまでpanelは表示しない
ｰ>なぜか初回にreadCacheディスパッチが発火せず
とりあえずloadedのときにpanel表示する変更
->fairypanelの背景が灰色のママ
* CreateFairy:74でuidが与えられていない。仕様が要調整
* 起動時にwindow is undefinedになるー＞ecosystemでundefined-night.svgを参照しようとしている->undefinedはビルド時の警告。実態はstateの遷移ミス
* ユーザを新規作成したときにアバターと背景を選ぶ
* editorで保存ボタンがウィンドウ右隅に表示される
* エディタからチャットルームに戻る or F5再起動時にwork.parts is undefinedになることがある。
logの内容も読まれていない。room.js:106で参照 
* ユーザの背景色を決めるUI
* chromeだと書き込みはできてるがsnapshotが更新されない
* {user}が展開されてない

* <br>で改行されていない
* CreateFairyで画像が見切れている

* BotMonitorで名前が表示されない
-> generate時にdisplayNameを復元するように修正

* ユーザ発言に分解されたものがダブる
-> writeLogとexecuteにそれぞれ同一内容のmessageを新たに作って渡して解消

* vocabで{enter_**}が位置文字ずつ区切られている
-> textToInternalReprが行われていない
-.>executeにtextTOInternalRepr追加

* 「こんにちは」にヒットしない
-> wv=zeros(cache.vocab.length)への操作
   wv[pos] = wv[pos] + 1
   の後でwvの中身が{ 5: NaN, 6: NaN, 7: NaN, _data: (9) […], _size: (1) […], _datatype: undefined }

となりsumが全て0になっている -> get,setに戻して済

* sum(wv)が0になる行がある
-> squeezedDictのfix　-> ok

* concatが帰ってこない
ｰ>dimemsionが変わってしまうのでsubsetに変更


* greetingが応答しない
-> momentUpperを大きくする。precisionを0.1にする
※precisionはテキストが完全正解の場合0.14だった。これは他のfeatureに引っ張られたため。正解=1.0なら
わかりやすいが現状はそうならない。わかりやすくする方法はあるか？？

* _renderが動作しない
-> totalScoreが長さ7でvalueOfが長さ8になってずれる

* reply.text.replaceが動作しない
-> replyにtextでなくmessageが入っているため。messageである必要は？？

* ログが最初の100件までしか取得されてない
-> reverseを入れてfix


