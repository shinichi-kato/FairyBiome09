/*
  episode part
  ===========================
  エピソード記憶を作り、エピソード記憶で返答するパート

  ## partの遅延コンパイル
  partがdeployされたとき、webworkerを用いた別スレッドで辞書のコンパイルを実行する。
  コンパイル完了前にreplier()が実行された場合は NOT_READYを返す。
  コンパイル完了後だと、有効な返答が生成できた場合はその文字列を、生成できなかった場合は
  NOT_FOUNDを返す。これによりUIの遅延が避けられる。

  NOT_FOUNDですべてのパートが終わった場合は$NOT_FOUND$を展開して終わる。
  NOT_READYで終わった場合は返答を生成しない。
*/

export const NOT_READY = -1;
export const NOT_FOUND = 0;

async function deploy(){
  
}