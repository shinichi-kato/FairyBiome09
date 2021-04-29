
export const getDateRad = (arg0,arg1) => {
  /* 一年を2*PIに変換した値を返す 
    getDateRad() ... 現在日時のrad値
    getDateRad(date) ... dateオブジェクトが格納する日時のrad値
    getDateRad(month,day) ... 今年のmonth月day日のrad値
  */
  let target;
  const now = new Date();
  const y = now.getFullYear();
  const start = (new Date(y, 0, 1, 0, 0)).getTime();
  const end = (new Date(y + 1, 0, 1, 0, 0)).getTime();

  if(arg0 === undefined) {
    arg0 = new Date();
  }
  if(typeof(arg0) === "number" && typeof(arg1)==="number") {
    target = new Date(y,arg0-1,arg1);
  }else{
    target = arg0;
  }

  return (target.getTime() - start) / (end - start) * 2 * Math.PI;
}

export const getHourRad = (arg0,arg1) => {
  /* 一日を2*PIに変換した値を返す。
    getHourRad() ... 現在時刻のrad値
    getHourRad(date) ... dateオブジェクトが格納する時刻のrad値
    getHourRad(hour,min) ... hour,minで指定した時刻のrad値
  */

  let h,m;
  if(arg0 === undefined){
    arg0 = new Date();
  }
  if(typeof(arg0)==="number" && typeof(arg1)==="number"){
    h = arg0;
    m = arg1;
  }else{
    h = arg0.getHours();
    m = arg0.getMinutes();
  }

  const mins = h * 60 + m;
  const oneDay = 24 * 60 - 1;

  return (mins / oneDay) * 2 * Math.PI;
}