/*
  PartBase
  チャットボットの「心のパート」ベースクラス

  type: string,
  behavior:{
    momentBand:{   
      upper: float,　// partが起動するmomentの上限
      lower: float, // partが起動するmomentの下限
    },
    precision: float, // 正確度:類似性スコアがこの値以上なら一致とみなす
    retention: float, // 継続率:次のターンもこのパートがトップを維持する確率
  }


*/


export default class PartBase {
  constructor(obj) {
    if (obj) {
      this.readObj(obj);
    } else {
      this.type = "recaller";
      this.behavior = {
        momentBand: {
          lower: 0,
          upper: 15,
        },
        precision: 0.4,
        retention: 0.8
      }

      this.dict = {
        script: [{ in: ["こんにちは"], out: ["今日は！"] }],
        encoder: null,
        renderer: null
      }
    }
  }

  readObj = (obj) => {
    this.type = obj.type;
    this.momentBand = {
      upper: parseFloat(obj.momentBand.upper),
      lower: parseFloat(obj.momentBand.lower),
    };
    this.precision = parseFloat(obj.precision);
    this.retention = parseFloat(obj.retention);

    this.dict = {
      script: [...obj.dict.script],
      encoder: null,
      renderer: null
    }
  }

  toObj = () => {
    const b = this.behavior;
    return {
      type: this.type,
      behavior: {
        momentBand: {
          lower: b.momentBand.lower.toFixed(2),
          upper: b.momentBand.upper.toFixed(2)
        },
        precision: b.precision,
        retention: b.retention,
      },
      dict: {
        script: this.dict.script,
      }
    }
  }
}