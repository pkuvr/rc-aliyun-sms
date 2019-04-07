"use strict";

const uuid = require('uuid/v4');
const Redis = require('ioredis');
const crypto = require('crypto');
const request = require('request');

/**
 * 阿里云短信服务
 */
class RcAliyunSms {
  constructor(accessKeyId, accessKeySecret, options = {}) {
    options.redis = options.redis || {port: 6379, host: '127.0.0.1'};
    options.lazyConnect = true;
    this.expire = options.expire || 1800;
    this.accessKeyId = accessKeyId;
    this.accessKeySecret = accessKeySecret;
    if (!this.accessKeyId || !this.accessKeySecret) {
      console.log('Error: accessKeyID and accessKeySecret required.');
      return;
    }
    //this.api = 'https://dysmsapi.aliyuncs.com/';
    this.redisClient = new Redis(options.redis.port, options.redis.host, {
      lazyConnect: options.lazyConnect,
      keepAlive: null
    });

    this.getSignature = (params) => {
      let paramsStr = this.toQueryString(params);
      let signTemp = `POST&${encodeURIComponent('/')}&${encodeURIComponent(paramsStr)}`;
      return crypto.createHmac('sha1', `${this.accessKeySecret}&`).update(signTemp).digest('base64')
    };

    this.toQueryString = (params) => {
      return Object.keys(params).sort().map(key => {
        return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
      }).join('&');
    }
  }

  /**
   * 发送短信
   * @param phone 手机号
   * @param signName 签名
   * @param tplId 模板ID
   * @param tplParams 模板参数
   * @param scene 使用场景
   * @returns {Promise}
   */
  sendSmsCode(phone, signName, tplId, tplParams, scene) {
    let self = this;
    if (typeof tplParams === 'object') {
      tplParams = JSON.stringify(tplParams);
    }
    let params = {
      PhoneNumbers: phone,
      Version: '2017-05-25',
      Format: 'JSON',
      SignName: signName,
      TemplateCode: tplId,
      TemplateParam: tplParams,
      SignatureMethod: 'HMAC-SHA1',
      SignatureNonce: uuid(),
      SignatureVersion: '1.0',
      OutId: uuid(),
      AccessKeyId: this.accessKeyId,
      Action: 'SendSms',
      Timestamp: new Date().toISOString(),
      RegionId: 'cn-hangzhou',
    };
    params.Signature = this.getSignature(params);


    return new Promise((resolve, reject) => {
      request({
        method: 'POST',
        url: 'https://dysmsapi.aliyuncs.com/',
        headers: {
          'cache-control': 'no-cache',
          'content-type': 'application/x-www-form-urlencoded'
        },
        form: params
      }, (error, response, body) => {
        if (response.statusCode === 201 || response.statusCode === 200) {
          //发送成功则缓存到redis,验证码
          const key = `sms:${phone}:scene:${scene}`;
          console.log("=======>>>>>>", tplParams, typeof tplParams, body);
          const b = JSON.parse(body);
          if (b.Code === 'OK') {
            self.redisClient.set(key, tplParams, 'EX', self.expire, function (e, reply) {
              if (e) {
                console.log('err =>', e);
                reject(e);
              } else {
                resolve(body);
              }
            });
          } else {
            reject(new Error(body));
          }
        } else {
          reject(new Error(body));
        }
      });
    });
  }

  /**
   * 验证验证码是否有效
   * @param phone 手机号
   * @param code 用户输入的验证码
   * @param scene 场景
   */
  async validateSmsCode(phone, code, scene) {
    const self = this;
    const key = `sms:${phone}:scene:${scene}`;
    try {
      const res = await self.redisClient.get(key);
      const rS = JSON.parse(res);
      if (code === rS.code) {
        self.redisClient.del(key);
        return true;
      }
      return false;
    } catch (e) {
      console.log('validate sms code error: ', e.message);
      return false;
    }
  }
}

module.exports = RcAliyunSms;
