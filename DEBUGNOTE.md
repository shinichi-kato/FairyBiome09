debug note
==============

1. チャットルーム

* 誰もいない森から帰ってきたあと、自分のチャットボットが戻らない
* 公園で吹き出しが白い
* チャットボットのdeployが完了するまでpanelは表示しない
ｰ>なぜか初回にreadCacheディスパッチが発火せず
とりあえずloadedのときにpanel表示する変更
->fairypanelの背景が灰色のママ
* 森に入ったときに出現するチャットボットの決定ロジック


* queueが消費されてない？


2. エディタ



3. 他

* CreateFairy:74でuidが与えられていない。仕様が要調整
* etimatorがconfig内に書かれてindexDBに保存されている。要除去
* /editを直でアクセスすると真っ白
* チャットボットをテンプレートから新規作成したときには名前と背景色を設定
* チャットボットを新規作成するときにfirestoreからもロード可能に

# 以下対応済み
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


