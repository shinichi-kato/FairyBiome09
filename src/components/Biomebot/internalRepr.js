/*
  InternalRepr
  文字列を内部表現（ノードのリスト）に変換する。
  文字列のリストを内部表現のリストに変換する。

  URLエンコードとキーワードのタグ化処理が終わっている文字列を形態素解析し、
  タグを一つの形態素に分離する。

    {memory}のことを教えてよ → ["{memory}","の","こと","教えて","よ"]

  さらに「猫が捕まえた」と「猫を捕まえた」の意味の違いを保持するため、単語＋助詞という並びが
  見つかったら「"猫","が"」ではなく「"猫","<猫:主語>"」という2ノードにする。
  ・ここで[:<>{}]がもとのセリフ(記憶やコマンドを意味しない文字列)に含まれていると記憶や
  コマンドをノードに分離できなくなるため、入力文字列は予めURLエンコードが必要である。

  例：お母さんが怒られた
  ["{_Mother_}","<{_Mother_}:が>","怒ら","れ","た"]
*/

export function textToInternalRepr(nodes) {
  // テキストを分かち書きしたリストを受け取り、内部表現に変換
  return parse(nodes);
}

export function dictToInternalRepr(dict) {
  // 文字列のリストを内部表現のリストに変換
  return dict.map(nodes=>{
    // const nodes = segmenter.segment(text);
    return parse(nodes);
  });
}

function dispatch(table) {
  /* 遷移表からディスパッチテーブルを生成 */
  const rt = table["*"].map(c=>new Object()); // c=>{} not work
  for (let k in table) {
    for (let i in table[k]) {
      let v = table[k][i];
      if (v !== 0) {
        rt[i][k] = v;
      }
    }
  }
  return rt;
}

const DI_PARTICLE_MAP = {
  "が": "主語", "は": "主語",
  "の": "所有",
  "に": "目的", "へ": "目的", "を": "目的",
  "で": "理由"
};

/* https://bottlecaps.de/rr/ui に貼り付けるとdiagram画像ができる
Particle ::= ("が" | "を" | "に" | "は" | "へ" | "で" | "の" )
Directive ::= "<...>"
Text ::= ( "*"^Particle Particle? | Particle | Directive | ("%" ("[0-9][0-9]" | [0-9A-F] [0-9A-F] | "[A-F][A-F]" ) ))+
*/
const STATE_TABLE = {
  //     0  1  2  3  4  5  6  7  8
  "*": [2, 2, 2, 2, 0, 0, 2, 2, 2],
  "p": [1, 0, 3, 0, 0, 0, 0, 0, 0],
  "%": [4, 4, 4, 4, 0, 0, 4, 4, 4],
  "dA": [0, 0, 0, 0, 5, 6, 0, 0, 0],
  "AA": [0, 0, 0, 0, 7, 0, 0, 0, 0],
  "<>": [0, 0, 8, 8, 0, 0, 0, 0, 8],

};

const STATE_TABLE_DISPATCH = dispatch(STATE_TABLE);

const LEX = {
  "*": s => false,
  "p": s => Boolean(DI_PARTICLE_MAP[s]),
  "%": s => s === "%",
  "dA": s => Boolean("0123456789ABCDEF".indexOf(s)),
  "AA": s => s.length === 2 && Boolean("ABCDEF".indexOf(s[0])),
  "<>": s => s[0] === "<" && s.slice(-1) === ">",
};

function next_state(state, node) {
  let defaultval = 0;
  const states = STATE_TABLE_DISPATCH[state];
  for (let key in states) {
    const val = states[key];
    if (key === "*") {
      defaultval = val;
      continue;
    }
    if (LEX[key](node)) return val;
  }
  return defaultval;
}

function parse(text) {
  let line = [];
  let buff = [];
  let state = 0;

  for (let node of text) {
    state = next_state(state, node);

    switch (state) {
      case 0 : {
        // clear
        line.push(...buff);
        buff.length = 0;
        continue;
      }
      case 1 :
      case 2 : {
        // through
        buff.length = 0;
        line.push(node);
        continue;
      }
      case 3: {
        // 非コマンドノードに続く助詞
        const particle = DI_PARTICLE_MAP[node];
        line.push("<" + line.slice(-1) + ":" + particle + ">");
        buff.length = 0;
        continue;
      }
      default: {}
    }

    buff.push(node);

    switch (state) {
      case 6:
      case 7: {
          line.push(buff.join(""));
          break;
      }
      default: {}
    }
  }
  return line;
}
