/* vectorize worker
  文字データを1-hot-vectorに変換

  Part.encoderの各行に格納されているenvを対象とする。
  envは文字列のリストで、
  ["晴れ","森","user"]
  ["晴れ","家","self"]
  のように各列が一つのfeatureに対応している。
  列ごとに現れる文字列の種類を全て調べ、その数に等しい
  サイズの1-hot-vectorを生成する。
  
*/

export async function vectorize(dict) {
  let env = dict.map(row => row.env);
  let tEnv = transpose(env);

  let vocab = empty2d(tEnv.length);

  for (let i = 0, l = tEnv.length; i < l; i++) {
    for (let word of tEnv[i]) {
      vocab[i][word] = true;
    }
  }

  // 各featureが何種類あるか調べる
  vocab = vocab.map(row => Object.keys(row));

  // 各featureごとに1-hot-vectorを与え,連結
  let matrix = []
  for (let feats of env) {
    matrix.push([].concat(feats.map((feat, i) =>
      onehot(vocab[i].length, vocab[i].indexOf(feat))
    )));
}

  return matrix;
}

const transpose = array => array[0].map((_, i) => array.map(row => row[i]));

function empty2d(size) {
  size = size > 0 ? size : 0;
  let arr = [];

  while (size--) {
    arr.push([]);
  }

  return arr;
}

function onehot(size, pos) {
  let array = new Array(size);
  for (let i = 0; i < size; i++) {
    array[i] = 0;
  }
  array[pos] = 1;
  return array;
}