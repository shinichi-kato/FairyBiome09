debug note
==============

* 
* vocabで{enter_**}が位置文字ずつ区切られている
-> textToInternalReprが行われていない
-.>executeにtextTOInternalRepr追加

* 「こんにちは」にヒットしない
-> wv=zeros(cache.vocab.length)への操作
   wv[pos] = wv[pos] + 1
   の後でwvの中身が{ 5: NaN, 6: NaN, 7: NaN, _data: (9) […], _size: (1) […], _datatype: undefined }

となりsumが0になっている -> get,setに戻して済

-> greetingが応答しない

* tfidfにnullが混入


