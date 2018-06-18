# rc-aliyun-sms

rc-aliyun-sms 是阿里云短信服务SDK，使用redis过期机制验证短信验证码有效性。

#### 支持功能

- 发送短信验证码
- 验证短信验证码有效性
- 区分不同使用场景

#### 安装

```
npm i rc-aliyun-sms --save
```

#### 接口

- `sendSmsCode` 发送验证码
- `validateSmsCode` 验证smscode有效性

#### 使用方法

发送验证码

```
const RcAliyunSms = require('rc-aliyun-sms');

let sms = new RcAliyunSms(
    accessKeyID,
    accessKeySecret,
    {
      expire: 1800, //验证码有效时间（秒）
      redis: {  //redis配置
        host: '127.0.0.1',
        port: 63790
      }
    }
  );

 sms.sendSmsCode('手机号', '签名', '短信模板ID', '{code:"1234"}', 场景ID)
       .then(res => {
         let o = JSON.parse(res);
         if (o.Code === 'OK' ) {
            //发送成功
         } else {
            //发送失败
         }
       })
       .catch(err => console.log(err));
```

验证有效性

```
sms.validateSmsCode('手机号', '验证码', 场景ID)
        .then(res => {
          if (res) {
            //验证码合法
          }
        })
        .catch(err => console.log(err));
```