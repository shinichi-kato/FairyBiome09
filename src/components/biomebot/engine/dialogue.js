
//@ts-check
/*
  ユーザ１名、チャットボット１名のみの環境でのチャットボットの応答

  1. 時刻により睡眠・覚醒の状態が変化
    覚醒確率がcircadian.jsxで定義される。覚醒時に覚醒チェックに失敗すると
    sleepyパートに遷移する。sleepy状態で覚醒チェックに失敗するとsleepパートに
    遷移する。sleep状態で声をかけられるとwakeパートに遷移する。
  
  2. 前回のユーザ返答からkeepAlive分を超えて経過していたらユーザは新たに
     会話を始めたとみなして状態をリセットする
   
  3. {enter_パート名}というトリガーが送られてきた場合、そのパートをHoist
     するとともに、INが{on_enter_part}である発言を行う。

  4. partOrderの順に返答生成ができるかチェック。
     返答を生成したらpartはpartOrder先頭に移動。retentionチェックを
     行い、drop判定になったらpartOrderの末尾に移動。

  (検討中) チャットボットが生成した発言にを感情性パート(cheer,down)の入力として
     与える 

  (廃止) moodが切り替わったらmoodと同名のパートが先頭になる。
     このパートはdrop/hoistの影響を受けない。 
     それにより、mood名と違うパートが一時的に先頭になってもそれが
     retentionチェックでdropしたらmood名と同じパートが再び先頭になる。

  実装予定
  ・ユーザに質問して答えを記憶するパート
  ・ユーザとの会話を記憶して返答に使うパート
*/
import { randomInt } from "mathjs";
import { retrieve } from './retrieve';
import * as knowledge from './knowledge-part';
import { Message } from '../../message';
import checkWake from '../circadian';
import { textToInternalRepr } from '../internal-repr';
import { TinySegmenter } from '../tinysegmenter';

let segmenter = new TinySegmenter();

const RE_ENTER = /{enter_([A-Za-z][a-zA-Z_]*)}/;
const RE_TAG = /{[a-zA-Z][a-zA-Z0-9_]*}/g;

/* 発言は一定時間のディレイをかけて出力する。ディレイの長さは出力する文字列の
長さで変化し、以下の式に従う。
delay = coeff*length^exp
*/
const MESSAGE_DELAY = { coeff: 100.0, exp:2.0};

const replier = {
  knowledge: knowledge.reply,
};

const renderer = {
  knowledge: knowledge.render,
};


export function execute(state, work, message, sendMessage) {
  // messageの型チェック
  console.assert(message instanceof Message, "room: execute Message型ではないmessageが渡されました");

  console.log("execute: user message= ", message);
  let reply = { text: null, drop: null, hoist: null };

  // phase 1. 覚醒チェック
  const topPart = work.partOrder[0];
  const isWake = checkWake(state.config.circadian);
  let newTopPart = null;

  if (!isWake) {
    if (topPart === 'sleepy' && 'sleep' in work.partOrder) {
      newTopPart = 'sleep';

    } else if (topPart !== 'sleep' && 'sleepy' in work.partOrder) {
      newTopPart = 'sleepy';
    }
  } else {
    if ((topPart === 'sleepy' || topPart === 'sleep') && 'wake' in work.partOrder) {
      newTopPart = 'wake';
    }
  }

  if (newTopPart) {
    console.log(`queueing {enter_${newTopPart}}`)
    // work.queue.push(
    //   {
    //     message: getTriggerMessage({
    //       name: message.name,
    //       text: `{enter_${newTopPart}}`
    //     }),
    //     emitter: sendMessage
    //   }
    // )
  }

  // shift queue

  // pahse 2. keepAliveチェック
  const now = new Date();
  if (work.userLastAccess + state.config.keepAlive * 60 * 1000 < now.getTime()) {
    // 会話を新規にスタート
    console.log("restarting chat.")
    work = {
      key: work.key + 1,
      mentalLevel: work.mentalLevel,
      moment: 0,
      partOrder: [...state.config.initialPartOrder],
      status: work.status,
      site: work.site,
      queue: [...work.queue, {
        message: getTriggerMessage({
          name: message.name,
          text: "{on_enter_part}"
        }),
        emitter: sendMessage
      }],
      futurePostings: [],
      userLastAccess: work.userLastAccess
    }

  } else {
    console.log("chat keeps alive", work.userLastAccess, state.config.keepAlive)
  }

  // phase 3. 外部トリガによるパート遷移
  let match = message.text.match(/^{enter_([^}]+)}$/);
  let partName = "";
  if (match) {
    partName = match[1];
    if (partName in state.parts) {
      hoist(partName, work.partOrder);
      message.text = "{on_enter_part}"
      console.log(`entering part ${partName}, order=`, work.partOrder)
    }
  }

  // (廃止)moodと同名のpartがあればそれをpartOrder先頭に移動
  // hoist(work.mood, work.partOrder);

  // phase 4. partが返答するかチェック
  const segmentedText = textToInternalRepr(segmenter.segment(message.text));

  let part;
  for (partName of work.partOrder) {
    part = state.parts[partName];

    // moment値+0~9のランダム値がmomentUpperとmomentLowerの
    // 間に入っていたらOK

    const moment = work.moment + randomInt(9);
    console.log("part", partName, "moment", moment, "l", part.momentLower, "u", part.momentUpper)
    if (moment <= part.momentLower || part.momentUpper < moment) {
      continue;
    }

    // 辞書の一致チェック
    const result = retrieve({ ...message, text: segmentedText }, state.cache[partName], part.coeffs);

    console.log("retrieve", result, "precision", part.precision)
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

    // bot発言に含まれる内部トリガーによるパート遷移
    let trigger = ""
    reply.text = reply.text.replace(RE_ENTER, (_, p1) => {
      // 関数内関数だが外に持ち出していないのでクロージャではない
      trigger = p1;
      return "";
    });

    // 各種トリガー処理
    if (trigger !== "" && trigger in state.parts) {
      // partと同名のトリガーを検出したら、そのpartを次回先頭にする。
      console.log(`queueing {enter_${trigger}}`)
      work.queue.push(
        {
          message: getTriggerMessage({
            name: message.name,
            text: `{enter_${trigger}}`
          }),
          emitter: sendMessage
        }
      );

    }

    break;
  }

  // hoist / drop
  drop(reply.drop, work.partOrder);
  hoist(reply.hoist, work.partOrder);

  console.log("reply", reply, "part", part)
  let replyText = reply.text;

  if (reply.text === null) {
    // NOT_FOUNDの生成
    // 入力文字列がトリガ /^{[a-z_]+}$/ の場合は null を返す。

    if (message.text.match(/^{[A-Za-z_]+}$/)) {
      replyText = null;
      
    } else {
      // そうでなければ以下の処理を行う。
      // 各partの辞書にNOT_FOUNDを置くことができ、partOrderの
      // 順にpartの辞書を探し、見つかったらそれをレンダリング。
      // すべてのパートに見つからなければmainのNOT_FOUNDを
      // レンダリング

      for (let partName of work.partOrder) {
        const part = state.parts[partName];

        replyText = renderer[part.kind](
          partName,
          state,
          work,
          "{NOT_FOUND}");

        if (replyText !== "{NOT_FOUND}") break;
      }

      if (replyText === "{NOT_FOUND}") {
        replyText = render("{NOT_FOUND}", state.main);
      }
      console.log("state.main", state.main)
    }
  }

  replyText = replyText
    .replace('{bot}', state.displayNmae)
    .replace('{user}', message.name || state.main.CREATOR_NAME || 'ユーザーさん');
  // ecosystemにはmessage.nameがない。そのような返答は起きるべきでないが、
  // fallbackとして作成者名を使用。

  // 文字列の長さに応じてディレイをかける
  setTimeout(()=>sendMessage(new Message(
    'speech',
    {
      text: replyText,
      name: state.displayName,
      person: "bot",
      avatarPath: state.config.avatarPath,
      backgroundColor: state.config.backgroundColor,
      mood: part.avatar,
      site: work.site,
    }
  )),MESSAGE_DELAY.coeff * replyText.length ^ MESSAGE_DELAY.exp);

  work.userLastAccess = now.getTime();
  work.moment += work.moment < work.mentalLevel ? 1 : 0;
  work.mentalLevel += work.moment === 10 ? 1 : 0;
  console.log("returning", work)

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

function getTriggerMessage(data) {
  // チャットボットに対してトリガーを入力。
  // 入力文字列はinternalReprに変換を行う
  let message = new Message("trigger", {
    name: data.name,
    text: data.text
  });

  return message;
}