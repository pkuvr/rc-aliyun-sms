"use strict";
let assert = require('chai').assert;

const RcAliyunSms = require('../lib/rc-aliyun-sms');
const accessKeyID = process.env.ALI_SMS_ACCESSKEYID;
const accessKeySecret = process.env.ALI_SMS_ACCESSKEYSECRET;


describe('rc-aliyun-sms', function () {
  let sms = new RcAliyunSms(
    accessKeyID,
    accessKeySecret,
    {
      expire: 5,//1800,
      redis: {
        host: '127.0.0.1',
        port: 63790
      }
    }
  );

  /**
   * 发送短信测试
   */
  it('#sendSmsCode()', function (done) {
    this.timeout(3000);
    sms.sendSmsCode('18853002966', '领跑', 'SMS_137685871', '{code:"1234"}', 1)
      .then(res => {
        let o = JSON.parse(res);
        assert.ok('OK', o.Code);
        done();
      })
      .catch(err => {
        console.log(err);
        done();
      });
  });


  it('#validateSmsCode()', function (done) {
    sms.validateSmsCode('18853002966', '1234', 1)
      .then(res => {
        assert.ok(true, res);
        done();
      })
      .catch(err => console.log(err));
  });

  it('#validateSmsCode() invalid', function (done) {
    this.timeout(6000);
    setTimeout(function () {
      sms.validateSmsCode('18853002966', '1234', 1)
        .then(res => {
          assert.ok(true, !res);
          done();
        })
        .catch(err => console.log(err));
    }, 5001);
  });

});