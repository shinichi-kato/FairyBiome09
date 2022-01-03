import React, { useState, createContext, useRef, useEffect } from 'react';
import { Noise } from 'noisejs';
import { useStaticQuery, graphql } from "gatsby";
import useInterval from '../use-interval';
import Container from '@mui/material/Container';
// import Box from '@mui/material/Box';
import { getDateRad, getHourRad } from '../calendar-rad.jsx';


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
const SEASONS = ['winter', 'winter', 'spring', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'winter'];

const WEATHERS = {
  'spring': ['storm', 'heavyRain', 'rain', 'rain', 'cloudy', 'cloudy', 'halfClouds', 'halfClouds', 'clear', 'clear'],
  'summer': ['storm', 'heavyRain', 'rain', 'cloudy', 'halfClouds', 'halfClouds', 'halfClouds', 'clear', 'clear', 'heat'],
  'autumn': ['storm', 'heavyRain', 'rain', 'cloudy', 'cloudy', 'halfClouds', 'halfClouds', 'halfClouds', 'clear', 'clear'],
  'winter': ['snowStorm', 'snow', 'snow', 'cloudy', 'cloudy', 'halfClouds', 'halfClouds', 'halfClouds', 'clear', 'clear'],
};

const SEVERE_WEATHERS = {
  'storm': true,
  'heavyRain': true,
  'rain': true,
  'snowStorm': true,
};

const SOLTICE = {
  sunrise: {
    summer: {
      dateRad: getDateRad(6, 15), // 夏至の日
      hourRad: getHourRad(5, 0),  // 夏至の日の出時刻
    },
    winter: {
      dateRad: null, // 冬至の日(夏至の半年後)
      hourRad: getHourRad(7, 0), // 冬至の日の出時刻
    },
  },
  sunset: {
    summer: {
      dateRad: null, // winter.dateRadの半年後
      hourRad: getHourRad(19, 0), // 夏至の日没時刻
    },
    winter: {
      dateRad: getDateRad(12, 1), // 冬至の日
      hourRad: getHourRad(17, 0), // 冬至の日没時刻
    },
  }
};

const CSunset = {
  a: (SOLTICE.sunset.winter.hourRad - SOLTICE.sunset.summer.hourRad) / 2,
  b: (SOLTICE.sunset.winter.hourRad + SOLTICE.sunset.summer.hourRad) / 2,
  t: SOLTICE.sunset.winter.dateRad,
};
const CSunrise = {
  a: (SOLTICE.sunrise.summer.hourRad - SOLTICE.sunrise.winter.hourRad) / 2,
  b: (SOLTICE.sunrise.summer.hourRad + SOLTICE.sunrise.winter.hourRad) / 2,
  t: SOLTICE.sunrise.summer.dateRad
};


function getDayPart(now) {
  /* nightOrDay(now) ... nowで与えられたタイムスタンプをmorning/noon/evening/ninghtに変換する
    
    年間を通して日の出、日没の時間は周期的に変化する。これをsinカーブで近似して
    仮想的な昼夜を生成する。
    日の出はsunrise.summer.hourRadを最小値とした一年周期のサインカーブ、
    日没はSUNSET.winter.hourRadを最小値とした一年周期のサインカーブとする。
  */
  if (now === undefined) {
    now = new Date();
  }
  const nowDateRad = getDateRad(now);

  const sunset = CSunset.a * Math.cos(nowDateRad + CSunset.t) + CSunset.b;
  const sunrise = CSunrise.a * Math.cos(nowDateRad + CSunrise.t) + CSunrise.b;
  // morning '朝', // 日の出前59分間から日の出240分まで
  // noon '昼', // 日の出241分後〜日没前120分まで
  // evening '夕', // 日没前121分〜日没後60分
  // night '夜', // 日没後61分〜日の出前60分まで

  // 1hをhourRadに換算すると = 1 / 24 * 2 * Math.PI = 1 / 12 * Math.PI 

  const nightEnd = sunrise - Math.PI / 12;
  const morningEnd = sunrise + Math.PI / 3;
  const noonEnd = sunset - Math.PI / 6;
  const eveningEnd = sunset + Math.PI / 12;
  // const nightStart = eveningEnd;
  // const nightEnd = morningStart; 

  const nowHourRad = getHourRad(now);
  if (nowHourRad < nightEnd) return "night";
  if (nowHourRad < morningEnd) return "morning";
  if (nowHourRad < noonEnd) return "noon";
  if (nowHourRad < eveningEnd) return "evening";
  return "night";

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
    昼夜を切り替える。朝/昼/夕/夜により背景画像は切り替える。 
      morning '朝', // 日の出前59分間から日の出240分まで
      noon '昼', // 日の出241分後〜日没前120分まで
      evening '夕', // 日没前121分〜日没後60分
      night '夜', // 日没後61分〜日の出前60分まで
    

    ** 天気 weather
    季節と乱数を用いて天気を生成する。基本的には天候が変わったときにchangeがセットされるが、
    人間が注意を向ける天候の変化は非対称らしく、

    |晴 → 曇|「曇った」
    |曇 → 晴|「晴れた」
    |雨 → 曇|「雨が止んだ」
    |曇 → 雨|「雨になった」
    
    雨、大雨、台風、雪、吹雪などのシビアな天候に対しては天候が終わったときにonExit

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
  const [dayPart, setDayPart] = useState(getDayPart(new Date())); /* 昼、夜 */
  const [change, setChange] = useState(null) /* weather,season,site,sceneの変化 */

  //---------------------------------------------------------------------------
  // 
  // 定期的に環境の変化を生成
  //

  useEffect(() => {
    console.log("ecosystem changeMonitor: ", change);
  }, [change])

  useInterval(() => {
    const now = new Date();
    const s = SEASONS[now.getMonth()];
    const p = getPressure(now, config.changeRate);
    const w = WEATHERS[s][Math.round(9 * p)];
    const d = getDayPart(now);

    setSeason(prevState => {
      if (prevState !== s) {
        setChange(s);
      };
      return s;
    });

    setPressure(p);

    setWeather(prevState => {
      if (prevState !== w) {
        if (prevState in SEVERE_WEATHERS) {
          setChange(`exit_${w}`)
        }
        else {
          setChange(w);
        }
      };
      return w;
    });

    setDayPart(prevState => {
      if (prevState !== d) {
        setChange(d);
      }
      return d;
    })

  }, config.updateInterval, true);

  function getPressure(timestamp, changeRate) {
    // ある時刻における気圧を返す
    if (timestamp === undefined) {
      timestamp = new Date();
    }

    return (noiseRef.current.simplex2(changeRate * timestamp.getTime(),
      0) + 1) * 0.5; // simplex2は-1〜+1の値を取る。それを0~1に換算
  }

  function getWeather(timestamp, changeRate) {
    if (timestamp !== undefined && changeRate !== undefined) {
      const p = getPressure(timestamp, changeRate);
      const s = SEASONS[timestamp.getMonth()];
      return WEATHERS[s][Math.round(9 * p)];
    }
    return weather;
  }

  function handleChangeSite(s) {
    setSite(s);
  }

  function handleChangeDispatched() {
    setChange(null);
  }

  // const weatherBg = `url(images/ecosystem/weather/${WEATHER_ICONS[weather]})`;
  const sceneBg = `url(images/ecosystem/set/${site}-${dayPart}.svg)`;
  const skyBg = `url(images/ecosystem/sky/${weather}-${dayPart}.svg)`;

   return (
    <EcosystemContext.Provider
      value={{
        pressure: pressure,
        season: season,
        getWeather: getWeather,
        getPressure: getPressure,
        site: site,
        getDayPart: getDayPart,
        change: change,
        changeDispatched: handleChangeDispatched,
        changeSite: handleChangeSite,
      }}
    >
      <Container
        fixed
        maxWidth="xs"
        disableGutters
        sx={{
          height: "100vh",
          backgroundImage: `${sceneBg},${skyBg}`,
          backgroundSize: `cover,cover`,
          backgroundRepeat: `no-repeat,no-repeat`,
        }}
      >
        {props.children}

      </Container>

    </EcosystemContext.Provider>
  )
}