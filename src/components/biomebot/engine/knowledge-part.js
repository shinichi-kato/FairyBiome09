//@ts-check
/*
  Knowledge Part
  =========================
  あらかじめ用意した辞書を使ってユーザのセリフに応答する。

  ## momentの変化

  momentは会話を通じて変化する短期的な精神的活力である。
  momentは受け取ったestimation値のぶんだけ増加または減少し、
  最大値はmentalLevel、最小値は0である。


  ## 学習

  チャットボットのセリフに対してユーザから評価値の高い返答があった場合、
  ユーザのセリフをin、チャットボットのセリフをoutとした記憶を新たに生成する。
  

  すべてのパートは同じ書式の辞書を用い、辞書にヒットしたかどうかの計算には
  共通のアルゴリズム(TF-IDFとfeature vectorによるcos類似度評価)を利用する。

*/

const RE_TAG = /{[a-zA-Z][a-zA-Z0-9_]*}/g;

function _render(text, tagDict) {
  if (!(text in tagDict)) return text;

  const items = tagDict[text];
  let item = items[Math.floor(Math.random() * items.length)];

  return item.replace(RE_TAG, (_, tag) => _render(tag, tagDict));
}

/**
 * state.cache[partName]を利用して文字列型の返答を生成する。
 * @param {String} partName パート名称
 * @param {Object} state bot.state
 * @param {Object} work bot.work
 * @param {Object} result retrieve()戻り値
 * @returns {String}
 */
export function reply(partName, state, work, result) {
  // cache.outScriptのresult.index行を使用

  const cache = state.cache[partName];

  const tagDict = cache.tagDict;

  const cands = cache.outScript[result.index];

  let cand = cands[Math.floor(Math.random() * cands.length)];

  let reply = _render(cand, tagDict);
  console.log("rendered reply=",reply);
  return reply;
}

/**
 * partNameのtagDictを使いtagを展開して返す
 * @param {String} partName 
 * @param {Object} state 
 * @param {Object} work 
 * @param {String} text 
 * @returns {String}
 */
export function render(partName, state, work, text) {
  // tagを展開して返す
  const tagDict = state.cache[partName].tagDict;

  const reply= _render(text, tagDict);
  return reply

}