export const getYearRad = (now = new Date()) => {
  /* 一年を2*PIに変換した値を返す */

  const y = now.getFullYear();
  const start = (new Date(y, 0, 1, 0, 0)).getTime();
  const end = (new Date(y + 1, 0, 1, 0, 0)).getTime();

  return (now.getTime() - start) / (end - start) * 2 * Math.PI;
}

export const getDayRad = (now = new Date()) => {
  /* 一日を2*PIに変換した値を返す */

  const h = now.getHours();
  const m = now.getMinutes();
  const mins = h * 60 + m;
  const oneDay = 24 * 60 - 1;

  return (mins / oneDay) * 2 * Math.PI;
}