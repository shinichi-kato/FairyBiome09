
/*
  室内でのチャットボットの応答

  1. 時刻により睡眠・覚醒の状態が変化
  ２．partOrderに従って

*/
import { null, randomInt } from "mathjs";
import { retrieve } from './retrieve';
import * as knowledge from './knowledge-part'
import { Message } from "@material-ui/icons";

const RE_ENTER = /{ENTER_([A-Z][A-Z_]+[A-Z])}/;

const moodNames = {
  "MOOD_PEACE": "peace",
  "MOOD_CHEER": "cheer",
  "MOOD_DOWN": "down",
  "MOOD_WAKE": "wake",
  "MOOD_SLEEPY": "sleepy",
  "MOOD_SLEEP": "sleep",
  "MOOD_ABSENT": "absent"
};

const replier = {
  knowledge: knowledge.reply,
};

const renderer = {
  knowledge: knowledge.render,
};


export function execute(state, work, message, sendMessage) {

  let reply = { text: null };

  // moodと同名のpartがあればそれをpartOrder先頭に移動
  hoist(work.mood, work.partOrder);

  for (let partName of work.partOrder) {
    const part = state.parts[partName];
    let reply = {};

    // 起動チェック
    // moment値+0~9のランダム値がmomentUpperとmomentLowerの
    // 間に入っていたらOK

    const moment = work.moment + randomInt(9);
    if (part.momentLower >= moment || moment > part.momentUpper) {
      continue;
    }

    // 辞書の一致チェック

    const result = retrieve(message, state.cache[partName]);
    if (result.score < part.precision) continue;

    // スピーチの生成
    reply = {
      text: repiler[part.kind](state, work, message),
      hoist: partName,
      drop: null,
    }

    // retentionチェック
    if (part.retention < Math.random()){
      reply.drop = partName;
      reply.hoist = null;
    }

    // トリガーをキャッチ
    let trigger = ""
    reply.text = reply.text.replace(RE_ENTER, (dummy, p1) => {
      // arrowかfuncか？
      trigger = p1;
      return "";
    });

    // 各種トリガー処理
    if (trigger !== "" && trigger in moodNames) {
      work.mood = moodNames[trigger];
      // 自己Message投下
      // 
      let msg = new Message(
        'trigger',
        `{TRIGGER_ENTER_${trigger}}`
      );

      msg = renderer[part.kind](state, work, msg);
      if (msg) {
        work.queue.push(msg)
      };

    }

    break;

  }

  // hoist / drop 
  drop(reply.drop, work.partOrder);
  hoist(reply.hoist, work.partOrder);

  if (reply.text === null) {
    // NOT_FOUNDの生成
    // 各partの辞書にNOT_FOUNDを置くことができ、partOrderの
    // 順にpartの辞書を探し、見つかったらそれをレンダリング。
    // すべてのパートに見つからなければmainのNOT_FOUNDを
    // レンダリング

    let msg = new Message('speech',{
      text:"{NOT_FOUND}",
    });

    loop1:
    {
      for (let partName of work.partOrder) {
        const part = state.parts[partName];

        let nf = renderer[part.kind](state,work,msg);
      
        if(nf.text != null) break loop1;
      }
      let nf = state.main["NOT_FOUND"]
    }

  }

  return new Measage(
    'speech',
    {
      text: reply.text,
      name: "",
      person: "bot",
      mood: work.mood,

    }
  )
}

function hoist(target, parts) {
  // targetをpartsの先頭に移動
  let pos = parts.indexOf(target);
  if (pos > 0) {
    let removed = parts.splice(pos, 1);
    parts.unshift(removed[0]);
  }
}

function drop(target, parts) {
  // target をpartsの末尾に移動
  let pos = parts.indexOf(target);
  if (pos !== -1 && pos<parts.length-1){
    let removed = parts.splice(pos,1);
    parts.push(removed[0]);
  }
}

function renderMain(){
  // main辞書の中でタグ展開
  // {[^}]+}はmain辞書内の同じ名前の内容で置き換える。
  
}