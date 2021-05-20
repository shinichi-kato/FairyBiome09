
export default function checkWake(circadian) {
  /* 
    circadianで示される確率で現在チャットボットが覚醒状態であるかどうかを決める。
    circadian{
      wake:覚醒時刻(24h),
      sleep:入眠時刻(24h),
      delta:傾き(分)
    }
    時刻tにおける覚醒・入眠の確率pは以下の式で表される。
    p = 1/(2*delta)*t + 0.5 - wake*60/(2*delta)
    p = -1/(2*delta)*t + 0.5 + sleep*60/(2*delta)
    これらの式はwakeまたはsleepの時刻に覚醒確率が0.5になり、その時刻からdelta分ずれた
    時刻に確率が0になる台形の確率分布を与える。ただしこの式は24時間での周期性を
    考慮していないので、0時や24時付近の挙動は予期したものとことなる。
    またこれらの式のうちwakeまたはsleepが現時刻に近い方を利用する
  */

  const now = new Date();
  const { wake, sleep, delta } = circadian;
  const hour = now.getHours();
  const t = hour * 60 + now.getMinutes();

  const p =
    Math.abs(hour - wake) < Math.abs(hour - sleep) ?
      1 / (2 * delta) * t + 0.5 - wake * 60 / (2 * delta) :
      -1 / (2 * delta) * t + 0.5 + sleep * 60 / (2 * delta);

  return Math.random() < p;
}