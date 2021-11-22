
//@ts-check
/*
  公園でのチャットボットの応答

  1. 時刻により睡眠・覚醒の状態が変化
  2. hubBehaviorに従って返答するか☑
  3. partOrderの順に返答生成ができるかチェック。
     返答を生成したらpartはpartOrder先頭に移動。retentionチェックを
     行い、drop判定になったらpartOrderの末尾に移動。
  4. moodが切り替わったらmoodと同名のパートが先頭になる。
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
  // messageの型チェック
  console.assert(message instanceof Message,"room: execute Message型ではないmessageが渡されました");

  console.log("execute: user message= ",message);
  let reply = { text: null, drop: null, hoist: null };
  
  // hub behavior チェック

  const util = state.config.hubBehavior.utilization;
  if(util >= Math.random){
    return work;
  }


  // shift queue
  

  // moodと同名のpartがあればそれをpartOrder先頭に移動
  hoist(work.mood, work.partOrder);

  for (let partName of work.partOrder) {
    const part = state.parts[partName];

    // moment値+0~9のランダム値がmomentUpperとmomentLowerの
    // 間に入っていたらOK

    const moment = work.moment + randomInt(9);
    console.log("part",partName,"moment",moment,"l",part.momentLower,"u",part.momentUpper)
    if (part.momentLower >= moment || moment > part.momentUpper) {
      continue;
    }

    // 辞書の一致チェック
    const result = retrieve(message, state.cache[partName],part.coeffs);
    
    console.log("retrieve",result,"precision",part.precision)
    if (result.score < part.precision) continue;

    // スピーチの生成
    const botMessageText = replier[part.kind](partName, state, work, result);

    reply = {
      text: botMessageText,
      hoist: partName,
      drop: null,
    }

    // retentionチェック
    if (part.retention < Math.random()) {
      console.log("retention: drop")
      reply.drop = partName;
      reply.hoist = null;
    }

    // トリガーを捕捉
    let trigger = ""
    console.log("reply",reply)
    reply.text = reply.text.replace(RE_ENTER, (_, p1) => {
      // ※クロージャ注意
      trigger = p1;
      return "";
    });

    // 各種トリガー処理
    if (trigger !== "" && trigger in state.parts) {
      // partと同名のトリガーを検出したら、そのpartを先頭にする。
      hoist(trigger, work.partOrder);
      
      // triggerがmoodのどれかと同じであったらmoodをその名前で上書きする。
      // そうでなければpart.initialMoodにする。
      if ('initialMood' in state.parts[trigger]) {
        work.mood = state.parts[trigger].initialMood 
      }
      else if (trigger in moodNames) {
        work.mood = trigger;
        work.queue.push({
          message: new Message('trigger', `{enter_${trigger}}`),
          emitter: sendMessage});
      }
      else {
        work.mood = "peace"
      }

      // 自発的Message投下

      let text = renderer[part.kind](partName, state, work,
        `{enter_${trigger}}`
      );
      if (text) {
        work.queue.push({
          message: new Message('speech',
            {
              text: text,
              name: state.displayName,
              person: "bot",
              avatarPath: state.config.avatarPath,
              backgroundColor: state.config.backgroundColor,
              mood: work.mood,
              site: work.site,
            }),
          emitter: sendMessage});
      };

    }

    // hoist / drop
    drop(reply.drop, work.partOrder);
    hoist(reply.hoist, work.partOrder);

    break;
  }


  console.log("reply",reply)
  if (reply.text === null) {
    // NOT_FOUNDの生成
    // 各partの辞書にNOT_FOUNDを置くことができ、partOrderの
    // 順にpartの辞書を探し、見つかったらそれをレンダリング。
    // すべてのパートに見つからなければmainのNOT_FOUNDを
    // レンダリング

    for (let partName of work.partOrder) {
      const part = state.parts[partName];

      reply.text = renderer[part.kind](
        partName,
        state,
        work,
        "{NOT_FOUND}");

      if (reply.text !== "{NOT_FOUND}") break;
    }

    if (reply.text === "{NOT_FOUND}") {
      reply.text = render("{NOT_FOUND}", state.main);
    }
    console.log("state.main",state.main)

    reply.text.replace('{bot}',work.displayName);
    reply.text.replace('{user}',message.name);
  }

  sendMessage(new Message(
    'speech',
    {
      text: reply.text,
      name: state.displayName,
      person: "bot",
      avatarPath: state.config.avatarPath,
      backgroundColor: state.config.backgroundColor,
      mood: work.mood,
      site: work.site,
    }
  ));
  console.log("returning",work)  
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
  if (pos !== -1 && pos < parts.length - 1) {
    let removed = parts.splice(pos, 1);
    parts.push(removed[0]);
  }
}

function render(tag, dict) {
  // main辞書の中でタグ展開
  // {[^}]+}はmain辞書内の同じ名前の内容で置き換える。
  if (!(tag in dict)) return tag;

  const items = dict[tag];

  let item = items[Math.floor(Math.random() * items.length)];

  item = item.replace(RE_TAG, (whole, itemTag) => render(itemTag, dict));

  return item;
}