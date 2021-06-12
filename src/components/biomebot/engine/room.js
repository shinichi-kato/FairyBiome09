
/*
  室内でのチャットボットの応答

  1. 時刻により睡眠・覚醒の状態が変化
  2. partOrderの順に返答生成ができるかチェック。
     返答を生成したらpartはpartOrder先頭に移動。retentionチェックを
     行い、drop判定になったらpartOrderの末尾に移動。
  3. moodが切り替わったらmoodと同名のパートが先頭になる。
     このパートはdrop/hoistの影響を受けない。 
     それにより、mood名と違うパートが一時的に先頭になってもそれが
     retentionチェックでdropしたらmood名と同じパートが再び先頭になる。

*/
import { randomInt } from "mathjs";
import { retrieve } from './retrieve';
import * as knowledge from './knowledge-part';
import { Message } from '../../message';

const RE_ENTER = /{enter_([A-Za-z][a-zA-Z_]*)}/;
const RE_TAG = /{[a-zA-Z][a-zA-Z0-9_]*}/g;

const moodNames = {
  "peace": true,
  "cheer": true,
  "down": true,
  "wake": true,
  "sleepy": true,
  "sleep": true,
  "absent": true,
};

const replier = {
  knowledge: knowledge.reply,
};

const renderer = {
  knowledge: knowledge.render,
};


export function execute(state, work, message, sendMessage) {
  let reply = { text: null };
  console.log("state in e",state,work)

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
      text: replier[part.kind](partName,state, work, result),
      hoist: partName,
      drop: null,
    }

    // retentionチェック
    if (part.retention < Math.random()){
      reply.drop = partName;
      reply.hoist = null;
    }

    // トリガーを捕捉
    let trigger = ""
    reply.text = reply.text.replace(RE_ENTER, (dummy, p1) => {
      // arrowかfuncか？
      trigger = p1;
      return "";
    });

    // 各種トリガー処理
    if (trigger !== "" && trigger in state.parts) {
      // partと同名のトリガーを検出したら、そのpartを先頭にする。
      // triggerがmoodのどれかと同じであったらmoodをその名前で上書きする。
      // そうでなければpart.initialMoodにする。
      hoist(trigger,work.partOrder);
      if('initialMood' in work.parts[trigger]){
        work.mood = work.parts[trigger].initialMood
      }
      else if(trigger in moodNames){
        work.mood = trigger;
      }
      else{
        work.mood = "peace"
      }

      // 自己Message投下

      let msg = renderer[part.kind](partName,state, work, 
        `{TRIGGER_ENTER_${trigger}}`
        );
      if (msg) {
        work.queue.push(msg)
      };

    }

    // hoist / drop
    drop(reply.drop, work.partOrder);
    hoist(reply.hoist, work.partOrder);

    break;
  }



  if (reply.text === null) {
    // NOT_FOUNDの生成
    // 各partの辞書にNOT_FOUNDを置くことができ、partOrderの
    // 順にpartの辞書を探し、見つかったらそれをレンダリング。
    // すべてのパートに見つからなければmainのNOT_FOUNDを
    // レンダリング

    for (let partName of work.partOrder) {
      const part = state.parts[partName];

      reply.text = renderer[part.kind](partName,state,work,
        "{NOT_FOUND}");
    
      if(reply.text !== "{NOT_FOUND}") break;
    }

    if(reply.text === "{NOT_FOUND}"){
      reply.text = render("{NOT_FOUND}", state.main);
    }

  }

  sendMessage(new Message(
    'speech',
    {
      text: reply.text,
      name: "",
      person: "bot",
      mood: work.mood,
      site: work.site,
    }
  ));

  return work;
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

function render(tag,dict){
  // main辞書の中でタグ展開
  // {[^}]+}はmain辞書内の同じ名前の内容で置き換える。
  if (!(tag in dict)) return tag;

  const items = dict[tag];
  
  let item = items[Math.floor(Math.random() * items.length)];

  item = item.replace(RE_TAG,(whole,tag)=>render(tag,dict));

  return item;
}