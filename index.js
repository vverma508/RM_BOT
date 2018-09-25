var Twit = require('twit')
var fs= require('fs')
var request= require('request');
var promise = require('bluebird');
var each=require('sync-each');
var args= require('./args')
const express = require('express')
const bodyParser = require('body-parser')
var path = require('path');

const app = express()
app.set('port', (process.env.PORT || 8080))
app.use(express.static(__dirname + '/public'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const server = app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'))
})

app.get('/', function(request, response) {
  var text= fs.readFileSync('./index.html','utf8');
  console.log("got in")
  response.header("Content-Type","text/html")
  response.send(text)
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

  // stream.on('follow', function (eventMsg) {
  //   var tweet="Hi @"+eventMsg.source.screen_name +"tweet @RMNBot3 with any #tag to know public response on that topic"
  //   T.post('statuses/update', { status:tweet }, function(err, data, response) {
  //     console.log(data)
  //     });

  //    tweet="@"+eventMsg.source.screen_name +" sample : @RMNBot3 #NASA"
  //    T.post('statuses/update', { status:tweet }, function(err, data, response) {
  //     console.log(data)
  //     });
  // })

  // stream.on('tweet', function(eventMsg){
  //   console.log(eventMsg);
  //   var text= eventMsg.text.substring(9);
  //   findTweetResult(text);
  // })