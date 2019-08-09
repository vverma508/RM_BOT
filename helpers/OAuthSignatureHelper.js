
var percentageEncoder= require("./percentage-encoder.js")
var HmacHelper = require("./security.js");
var config= require("../args.js").config;
var security= require("./security.js");


exports.AuthenticationObject = {
    oauth_consumer_key: config.consumer_key,
    oauth_nonce: security.GetNonce(32),
    oauth_signature: "",
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: security.GetUnixEpoch(),
    oauth_token: config.access_token,
    oauth_version: "1.0"
}

exports.getOAuthSignature =function(params,baseUrl,httpType){

var messages = [];
messages.push(httpType);
messages.push(percentageEncoder.EncodeString(baseUrl));
messages.push(percentageEncoder.EncodeString(percentageEncoder.EncodeObj(MergeObjects(params, oAuth))));

var siningKey = config.consumer_secret + "&" + config.access_token_secret;

return HmacHelper.GetOAuthSignature(siningKey, messages.join('&'));

}