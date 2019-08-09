var OAuth = require('oauth');
var args= require('./args')

var twitter_application_consumer_key = args.config.consumer_key;  // API Key
var twitter_application_secret = args.config.consumer_secret;  // API Secret
var twitter_user_access_token = args.config.access_token;  // Access Token
var twitter_user_secret = args.config.access_token_secret;  // Access Token Secret

var oauth = new OAuth.OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    twitter_application_consumer_key,
    twitter_application_secret,
    '1.0A',
    null,
    'HMAC-SHA1'
  );

exports.tweet= function(req,response){

    var status = 'test tweet';  // This is the tweet (ie status)
    var postBody = {
      'status': status
    };
    oauth.post('https://api.twitter.com/1.1/statuses/update.json',
      twitter_user_access_token,  // oauth_token (user access token)
        twitter_user_secret,  // oauth_secret (user secret)
        postBody,  // post body
        '',  // post content type ?
      function(err, data, res) {
        if (err) {
          console.log(err);
          response.end()
        } else {
           console.log(data);
           response.send(data);
        }
      });
  }

  exports.searchTweets = function(request,response){
    var postBody = {
      'query':"@:"+request.query.value,
      'maxResults':'500'
    };
    oauth.post('https://api.twitter.com/1.1/tweets/search/30day/dev.json',
      twitter_user_access_token,  // oauth_token (user access token)
        twitter_user_secret,  // oauth_secret (user secret)
        postBody,  // post body
        'application/json',  // post content type ?
      function(err, data, res) {
        if (err) {
          console.log(err);
          response.end()
        } else {
           console.log(data);
           response.send(data);
        }
      });
  }
  