/*
 * Biomebotのchatbot.jsonが適正なデータ構造になっているかを確認する
 * schemeの定義。validateにはjoiを使用
 * 
 * 下記のテスターでチェック済み
 * https://joi.dev/tester/
 */

import Joi from "joi-browser";
export const schema = 
Joi.object({
  botId: Joi.string().allow(null).required(),
  config: Joi.object({
    description: Joi.string().min(0).max(200).required(),
    backgroundColor: Joi.string().regex(/^#[0-9a-fA-F]{6}$/).required(),
    circadian: Joi.object({
      wake: Joi.number().integer().min(0).max(23).required(),
      sleep: Joi.number().integer().min(0).max(23).required(),
    }).required(),
    initialMentalLevel: Joi.number().integer().min(1).max(100).required(),
    initialPartOrder: Joi.array().items(Joi.string()).required(),
    hubBehavior: Joi.object({
      utilization: Joi.number().min(0).max(1).required(),
      precision: Joi.number().min(0).max(1).required(),
      retention: Joi.number().min(0).max(1).required(),
    }).required(),
    keepAlive: Joi.number().required(),
  }).required(),
  work: Joi.object({
    updatedAt: Joi.any().required(),
    partOrder: Joi.array().items(Joi.string()).required(),
    mentalLevel: Joi.number().integer().required(),
    moment: Joi.number().integer().required(),
    queue: Joi.array().items(Joi.string()),
    timerPostings: Joi.array().items(Joi.string()),
    userLastAccess: Joi.number().required()
  }).required(),

  main: Joi.object({
    NAME: Joi.string().required(),
    CREATOR_NAME: Joi.string().required(),
    POSITIVE_LABEL: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
    NEGATIVE_LABEL: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
    START_DECK: Joi.any(),
    END_DECK: Joi.any(),
    "{NOT_FOUND}": Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
  }).required(),

  parts: Joi.object().pattern(Joi.string().min(1), Joi.object({
    kind: Joi.string().valid('knowledge', 'curiosity', 'episode').required(),
    avatar: Joi.string().required(),
    momentUpper: Joi.number().integer().min(0).max(100).required(),
    momentLower: Joi.number().integer().min(0).max(100).required(),
    precision: Joi.number().min(0).max(1).required(),
    retention: Joi.number().min(0).max(1).required(),
    scriptTimestamp: Joi.string().allow(null).required(),
    cacheTimestamp: Joi.string().allow(null).required(),
    featureWeights: Joi.any(),
    script: Joi.array().items(Joi.object({
      in: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).required(),
      out: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).required(),
    }))
  }))
});

