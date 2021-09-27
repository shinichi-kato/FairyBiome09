debug note
==============

1. チャットルーム

*{NOT_FOUND}が展開されてない

* triggerに応答していない？
* queueが消費されてない？


* <br>で改行されていない
* {user}が展開されてない

* {enter_night}にgreetingsが応答している

2. エディタ


# 以下対応済み
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


