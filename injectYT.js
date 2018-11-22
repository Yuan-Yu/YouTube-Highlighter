var queryURLTemplate = "https://www.googleapis.com/youtube/v3/commentThreads?pageToken={PAGETOKEN}&part=snippet%2Creplies&maxResults=50&order=relevance&videoId={VIDEOID}&fields=items(replies(comments(snippet(authorChannelUrl%2CauthorDisplayName%2CauthorProfileImageUrl%2ClikeCount%2CtextDisplay%2CtextOriginal%2CviewerRating)))%2Csnippet(topLevelComment(snippet(authorChannelUrl%2CauthorDisplayName%2CauthorProfileImageUrl%2ClikeCount%2CtextDisplay%2CtextOriginal))%2CtotalReplyCount))%2CnextPageToken&key={YOUR_API_KEY}"
var YOURAPIKEY = "";

var player = document.getElementById('movie_player');
var re = /((?<=v\=)(.*)(?=[&]))|((?<=v\=)(.*))/g;
var lastURL = "";
window.addEventListener('popstate',removeYTHL);


function formatQueryURL(key,videoID,pagetoken){
    if(typeof(pagetoken)== "undefined") pagetoken = "";
    let queryURL = queryURLTemplate.replace(/\{YOUR_API_KEY\}/g,key)
                            .replace(/\{VIDEOID\}/g,videoID)
                            .replace(/\{PAGETOKEN\}/g,pagetoken)  
    return queryURL;
}
  
function nestDo(key,videoID,times,maxTimes,callback,pagetoken){
  if(typeof(pagetoken)== "undefined") pagetoken = "";
  let queryURL = formatQueryURL(key,videoID,pagetoken);
  axios.get(queryURL).then((response)=>{
    var data = response['data'];
    callback(data);
    times += 1;
    if(times < maxTimes){
      if(typeof(data['nextPageToken']) != "undefined"){
        nestDo(key,videoID,times,maxTimes,callback,data['nextPageToken'])
      }
    }
  })
}

function handleRawout(data){
  var comments = [];
  if(items = data['items']){
    items.forEach((item)=>{
      comments = comments.concat(extractCommentInfo(item));
    });
  }
  return comments.filter(comment => comment['timePoints'].length > 0);
}

function extractCommentInfo(item){
  var comments = [];
  comments.push(handleInfo(item['snippet']['topLevelComment']['snippet']));
  if(item['replies']){
    item['replies']['comments'].forEach((replieItem)=>{
      comments.push(handleInfo(replieItem['snippet']));
    });
  }
  return comments;
}

function handleInfo(spippet){
  var comment = {};
  comment['likeCount'] = spippet['likeCount'];
  comment['textDisplay'] = spippet['textDisplay'];
  comment['authorDisplayName'] = spippet['authorDisplayName'];
  comment['authorProfileImageUrlc'] = spippet['authorProfileImageUrl'];
  comment['timePoints'] = parseTime(comment['textDisplay']);
  comment['textOriginal'] = spippet['textOriginal'];
  return comment;
}


var timePattern = /(?<=t\=)(\d+\w)+/g;
var unitTimePattern = /(\d+)(\w)/g;

function parseTime(displayText){
  var timePoints = [];
  while(timePoint = timePattern.exec(displayText)){
    let textTime = timePoint[0];
    timePoints.push(textTime2Sencond(textTime));
  }
  return timePoints;
}

function textTime2Sencond(textTime){
  var unitInSecond = 0;
  while(unitTime = unitTimePattern.exec(textTime)){
    let value= parseInt(unitTime[1]);
    let unit = unitTime[2];
    switch(unit){
      case "d":
        unitInSecond += value * 86400;
        break;
      case "h":
        unitInSecond += value * 3600;
        break;
      case "m":
        unitInSecond += value * 60;
        break;
      case "s":
        unitInSecond += value;
        break;          
    }
  }
  return unitInSecond;
}
function renderBar(data){
  var comments = handleRawout(data);
  var duration = player.getDuration();
  var bar = document.getElementsByClassName('ytp-progress-bar')[0];
  var barPadding = document.getElementsByClassName('ytp-progress-bar-padding')[0];
  var highLighElements = []
  comments.forEach((comment) =>{
    highLighElements = highLighElements.concat(createHighLights(comment,duration));
  });
  highLighElements.forEach((highLighElement)=>{
    bar.insertBefore(highLighElement,barPadding);
  });
}

function createHighLights(comment,duration){
  var highLighElements = [];
  // console.log(comment);
  comment['timePoints'].forEach((timePoint)=> {
    if(timePoint<duration){
      highLighElements.push(createHighLight(timePoint,comment,duration));
    }
  });
  return highLighElements;
}

function createHighLight(timePoint,comment,duration){
  var point = document.createElement("YTHL");
  var position = Math.round((timePoint/duration) *100);
  point.title = comment['textOriginal'];
  point.style.left = 'calc('+position+"% "+"- 3px)";
  point.onclick = function(event){
    event.stopPropagation();
    player.seekTo(timePoint,true);
  };
  point.onmousedown = function(event){event.stopPropagation();};
  point.onmouseup = function(event){event.stopPropagation();};
  return point;
}

function removeYTHL(){
  var YTHLs = document.getElementsByTagName('YTHL');
  var length = YTHLs.length;
  for(var i=0;i<length;i++){
    let YTHL = YTHLs[0];
    YTHL.parentNode.removeChild(YTHL);
  }
}

function runYTHL(){
  if(document.URL != lastURL){
    lastURL = document.URL;
    var videoID = re.exec(document.URL)[0];
    while(re.exec(document.URL)){};
    nestDo(YOURAPIKEY,videoID,0,5,renderBar,"");
  }
}
