const crypto = require('crypto')
const nonce= require('nonce-str');

module.exports.get_challenge_response = function(crc_token, consumer_secret) {

  hmac = crypto.createHmac('sha256', consumer_secret).update(crc_token).digest('base64')

  return hmac
}
module.exports.GetOAuthSignature= function(key,message){

  return crypto.createHmac('sha1', key).update(message).digest('base64')
}

exports.GetNonce= function(length){
  return nonce(length);
}

exports.GetUnixEpoch = function(){
return  Math.floor(new Date() / 1000);
}