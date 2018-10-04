var Twit = require('twit')
var fs= require('fs')
var request= require('request-promise');
var promise = require('bluebird');
var each=require('sync-each');
var args= require('./args')
var configs = require('./config')
const express = require('express')
const bodyParser = require('body-parser')
var path = require('path');
var security= require('./helpers/security.js')
const passport = require('passport')
const queryString = require('query-string')
const TwitterStrategy = require('passport-twitter')
const httpAuth = require('http-auth')

const app = express()
app.set('port', (process.env.PORT || 8080))
app.use(express.static(__dirname + '/public'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const server = app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'))
})


// Configure the Twitter strategy for use by Passport.
passport.use(new TwitterStrategy({
  consumerKey: args.config.consumer_key,
  consumerSecret: args.config.consumer_secret,
  // we want force login, so we set the URL with the force_login=true
  userAuthorizationURL: 'https://api.twitter.com/oauth/authenticate?force_login=true',
  callbackURL: "https://rm-bot3.herokuapp.com/callbacks/addsub"
},
// stores profile and tokens in the sesion user object
// this may not be the best solution for your application
function(token, tokenSecret, profile, cb) {
  return cb(null, {
    profile: profile,
    access_token: token,
    access_token_secret: tokenSecret
  })
}
))

// Configure Passport authenticated session persistence.
passport.serializeUser(function(user, cb) {
cb(null, user);
})

passport.deserializeUser(function(obj, cb) {
cb(null, obj);
})

app.get('/callbacks/:action', passport.authenticate('twitter', { failureRedirect: '/' }),
  require('./helpers/sub-callbacks'))

app.get('/subscriptions/add', passport.authenticate('twitter', {
  callbackURL: '/callbacks/addsub'
}));

/**
 * Receives challenge response check (CRC)
 **/
app.get('/webhook/twitter', function(request, response) {

  var crc_token = request.query.crc_token
  console.log("CRC request from twitter");
  console.log(request.query);
  if (crc_token) {
    var hash = security.get_challenge_response(crc_token, args.config.consumer_secret)

    response.status(200);
    response.send({
      response_token: 'sha256=' + hash
    })
  } else {
    response.status(400);
    response.send('Error: crc_token missing from request.')
  }
})


/**
 * Receives Account Acitivity events
 **/
app.post('/webhook/twitter', function(request, response) {

  console.log(request.body)
  response.send('200 OK')
})


var webhook = {}


/**
 * Retrieves existing webhook config and renders
 */
webhook.get_config = function (req, resp) {
  // construct request to retrieve webhook config
  var request_options = {
    url: 'https://api.twitter.com/1.1/account_activity/all/' +configs.env + '/webhooks.json',
    oauth: args.config
  }

  request.get(request_options)

  // success
  .then(function (body) {
    var json_response = {
      configs: JSON.parse(body),
      //csrf_token: req.csrfToken(),
      update_webhook_url: 'https://' + req.headers.host + '/webhook/twitter'
    }

    if (json_response.configs.length) {
      json_response.update_webhook_url = json_response.configs[0].url
    }

    console.log(json_response)
    resp.render('webhook', json_response)
  })

  // failure
  .catch(function (body) {
    if (body) {
      console.log(body)
    }
    var json_response = {
      title: 'Error',
      message: 'Webhook config unable to be retrieved',
      button: {
        title: 'Ok',
        url: '/webhook'
      }
    }

    resp.status(500);
    resp.render('status', json_response)
  })
}

app.get('/webhook',webhook.get_config)


var createWebhookConfig=function(req,res){
// request option
var request_options = {
  url: 'https://api.twitter.com/1.1/account_activity/all/' + configs.env + '/subscriptions.json',
  oauth: args.config,
  headers: {
    'Content-type': 'application/x-www-form-urlencoded'
  },
  form: {
    url: 'https://rm-bot3.herokuapp.com/webhook/twitter'
  }
}

// POST request to create webhook config
request.post(request_options).then(function (body) {
  console.log(body)
  res.send(body);
}).catch(function (body) {
  console.log(body)
})
}
app.get('/createWebhookConfig',createWebhookConfig)

app.get('/', function(request, response) {
  var text= fs.readFileSync('./index.html','utf8');
  console.log("got in")
  response.header("Content-Type","text/html")
  response.send(text)
})
var testVariable;

app.post('/webhook/twitter', function(req,res){
  console.log("enevnt from twitter")
  console.log(res);
  testVariable=res;
  res.send('200 OK')
})

app.get('/test', function(){
  response.send(JSON.stringify(testVariable));
})
var T = new Twit(args.config)

  var resArray=[];
 //var stream= T.stream('user');
  
  var findTweetResult= function(text){
    T.get('search/tweets', { q: text+' since:2018-09-01', count:100}, function(err, data, response) {
      var finalResult={};
      finalResult.pos=0;
      finalResult.neg=0;
      finalResult.neutral=0;
     var dataSrting= JSON.stringify(data);
     fs.writeFile("./data.json",dataSrting); 
     
     data.statuses.forEach(function(current,index,arr){
        getSentiment(current,index,arr.length).then(function(calback){
         calback();
        });
     })
})
  }

  var getSentiment = function(data,curr,length){
    var allCompleted=false;
    return new promise(function(resolve,reject){   
      var result={};
      result.pos=0;
      result.neg=0;
      result.neutral=0
        request.post("http://text-processing.com/api/sentiment/", {form:{text:data.text.toString()}},function(err,response,sentimentData){
            var sentiment=JSON.parse(sentimentData);                  
            if(sentiment.label=="pos"){
              result.pos++;
            }
            else if(sentiment.label=='neutral'){
              result.neutral++;
            }
            else if(sentiment.label=='neg'){
              result.neg++;
            }
            
            resArray.push(result);

            if(resArray.length==length){
              allCompleted=true;
            }
            resolve(sentimentCalc(resArray,allCompleted));
        });
      
    });
  }

  var sentimentCalc= function(sentiments,allCompleted){
    if(allCompleted){
      var pos=0;
      var neg=0;
      var neutral=0;
      sentiments.forEach(function(curr,index,arr){
        console.log(curr);
        pos=pos+curr.pos;
        neg=neg+curr.neg;
        neutral=neutral+curr.neutral;
      }) ;
      
      var tweet= "#tag have " +pos + "+ve, "+neg+"-ve, "+neutral+"netral tweets this month"

      T.post('statuses/update', { status:tweet }, function(err, data, response) {
             console.log(data)
       });
    }    
  }