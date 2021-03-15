import React, { useState, createContext, useRef } from 'react';
import { Noise } from 'noisejs';
import { useStaticQuery, graphql } from "gatsby";
import useInterval from 'use-interval';

import { getDateRad, getHourRad } from '../../calendar-rad.jsx';


void undefined; /* for detect undefind */

export const EcosystemContext = createContext();

const query = graphql`
query j {
  allFile(filter: {sourceInstanceName: {eq: "images"}, relativeDirectory: {eq: "ecosystem"}}) {
    edges {
      node {
        relativePath
      }
    }
  }
  site {
    siteMetadata {
      ecosystem {
        changeRate
        randomSeed
        updateInterval
      }
    }
  }
}
`

//                1    2     3    4     5     6     7     8    9    10   11    12   
const SEASONS = ['冬', '冬', '春', '春', '春', '春', '夏', '夏', '夏', '秋', '秋', '冬'];

const WEATHERS = {
  '春': ['台風', '大雨', '雨', '雨', '曇', '曇', '晴', '晴', '快晴', '快晴'],
  '夏': ['台風', '大雨', '雨', '曇', '晴', '晴', '晴', '快晴', '快晴', '夏晴'],
  '秋': ['台風', '大雨', '雨', '曇', '曇', '晴', '晴', '晴', '快晴', '快晴'],
  '冬': ['吹雪', '雪', '雪', '曇', '曇', '晴', '晴', '晴', '快晴', '快晴'],
};

const WEATHER_ICONS = {
  '台風': 'wi-hurricane.svg',
  '大雨': 'wi-rain.svg',
  '雨': 'wi-showers.svg',
  '曇': 'wi-cloudy.svg',
  '晴': 'wi-day-cloudy.svg',
  '快晴': 'wi-sunny.svg',
  '夏晴': 'wi-thermometer.svg',
  '吹雪': 'wi-snow-wind.svg',
  '雪': 'wi-snow.svg',
}

const SUNRAISE = {
  summer: {
    dateRad: getDateRad(6, 15),
    hourRad: getHourRad(5, 0),
  },
  winter: {
    dateRad: null, // summer.dateRadの半年後
    hourRad: getHourRad(7, 0),
  },

};

const SUNSET = {
  summer: {
    dateRad: null, // winter.dateRadの半年後
    hourRad: getHourRad(19, 0),
  },
  winter: {
    dateRad: getDateRad(12, 1),
    hourRad: getHourRad(17, 0),
  },
}


export default function EcosystemProvider(props) {
  /*
    EcosystemProviderは
    時間による夜／昼の変化、季節、天候、場所など
    システムの仮想環境を提供する。これらの変化により
    backgroundの画像を変化させ、環境の変化にトリガーした
    メッセージをチャットボットに送る。

    ** 夜/昼の変化 dayPart
    日本の平均的な日没・日の出を大雑把に近似した時刻を用いて
    夜／昼を切り替える。夜／昼により背景画像は切り替える

    ** 天気 weather
    季節と乱数を用いて天気を生成する。

    ** 場所 site
    自分の部屋(room)、森(forest)、公園(park)の３箇所がある。
    場所により背景画像を切り替える。
    昼夜によっても背景が変わるため、昼夜2種類×場所3種類の
    6種類の背景画像を与える

    これらの変化が生じたとき、changeに変化した内容が格納される。
    変化したことをconsumer側で利用した後はonChangeAcknowledged()を
    呼ぶことでchangeの内容がリセットされる。

  */
  const data = useStaticQuery(query);
  const config = data.site.siteMetadata.ecosystem;
  // const scenes = data.allFile.edges.map(n=>n.node);

  const noiseRef = useRef(new Noise(config.randomSeed));

  const [pressure, setPressure] = useState(); /* 仮想気圧 0〜1 */
  const [weather, setWeather] = useState(); /* 仮想天気 */
  const [season, setSeason] = useState(); /* 季節 */
  const [site, setSite] = useState('room'); /* 場所 */
  const [dayPart, setDayPart] = useState(); /* 昼、夜 */
  const [change, setChange] = useState() /* weather,season,site,sceneの変化 */


  useInterval(() => {
    const now = new Date();
    const s = SEASONS[now.getMonth()];
    let p = noiseRef.current.simplex2(config.changeRate * now, 0);
    p = (p + 1) * 0.5; /* 非負 (0〜1)に換算*/
    const w = WEATHERS[s][Math.round(9 * p)];
    const d = nightOrDay();

    setSeason(prevState => {
      if (prevState !== s) {
        setChange(s);
      };
      return s;
    });

    setPressure(prevState => {
      if (prevState !== p) {
        setChange(p);
      };
      return p;
    });

    setWeather(prevState => {
      if (prevState !== w) {
        setChange(w);
      };
      return w;
    });

    setDayPart(prevState => {
      if (prevState !== d) {
        setDayPart(d);
      }
      return d;
    })

  }, config.updateInterval);

  function nightOrDay() {
    /* nightOrDay() ... 現時刻が夜なら"night",現時刻が昼なら"day"を返す。
      
      年間を通して日の出、日没の時間は周期的に変化する。これをsinカーブで近似して
      仮想的な昼夜を生成する。
      日の出はSUNRAISE.summer.hourRadを最小値とした一年周期のサインカーブ、
      日没はSUNSET.winter.hourRadを最小値とした一年周期のサインカーブとする。
    */
    let l, e, grad, intc;
    let now = getDateRad();

    l = SUNSET.winter.getHourRad;
    e = SUNSET.summer.getHourRad;
    grad = (l - e) / 2;
    intc = (e + l) / 2;
    let sunset = grad * Math.cos(now + SUNSET.winter.dateRad) + intc;

    l = SUNRAISE.summer.getHourRad;
    e = SUNRAISE.winter.getHourRad;
    grad = (l - e) / 2;
    intc = (e + l) / 2;
    let sunraise = grad * Math.cos(now + SUNRAISE.summer.dateRad) + intc;

    return (sunraise < now && now < sunset) ? "day" : "night";

  }

  function handleChangeSite(s) {
    setSite(s);
  }

  function onChangeAcknowledged() {
    setChange(null);
  }

  const weatherBg = `url(images/ecosystem/weather/${WEATHER_ICONS[weather]})`;
  const sceneBg = `url(images/ecosystem/${site}-${dayPart}.svg)`;
  return (
    <EcosystemContext.Provider
      value={{
        pressure: pressure,
        season: season,
        weather: weather,
        site: site,
        dayPart: nightOrDay,
        change: change,
        changeAcknowledged: onChangeAcknowledged,
        changeSite: handleChangeSite,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100vh",
          backgroundImage: `${weatherBg},${sceneBg}`,
          backgroundSize: `150px,cover`,
          backgroundRepeat: `no-repeat,no-repeat`
        }}
      >
        {props.children}

      </div>

    </EcosystemContext.Provider>
  )
}