var queryURLTemplate = "https://www.googleapis.com/youtube/v3/commentThreads?pageToken={PAGETOKEN}&part=snippet%2Creplies&maxResults=50&order=relevance&videoId={VIDEOID}&fields=items(replies(comments(snippet(authorChannelUrl%2CauthorDisplayName%2CauthorProfileImageUrl%2ClikeCount%2CtextDisplay%2CtextOriginal%2CviewerRating)))%2Csnippet(topLevelComment(snippet(authorChannelUrl%2CauthorDisplayName%2CauthorProfileImageUrl%2ClikeCount%2CtextDisplay%2CtextOriginal))%2CtotalReplyCount))%2CnextPageToken&key={YOUR_API_KEY}"
var YOURAPIKEY = "";
var maxColor = [68,142,246];
var minColor = [218,232,253];
var tooltipSize = 360;
var player = document.getElementById('movie_player');
var re = /((?<=v\=)(.*)(?=[&]))|((?<=v\=)(.*))/g;
var lastURL = "";
var currentLikeCounts = [];
var maxCommentLines = 6;
window.addEventListener('popstate',removeYTHL);


function formatQueryURL(key,videoID,pagetoken){
    if(typeof(pagetoken)== "undefined") pagetoken = "";
    let queryURL = queryURLTemplate.replace(/\{YOUR_API_KEY\}/g,key)
                            .replace(/\{VIDEOID\}/g,videoID)
                            .replace(/\{PAGETOKEN\}/g,pagetoken)  
    return queryURL;
}
  
function nestDo(key,videoID,times,maxTimes,callback,pagetoken,finalCallback){
  if(typeof(pagetoken)== "undefined") pagetoken = "";
  let queryURL = formatQueryURL(key,videoID,pagetoken);
  axios.get(queryURL).then((response)=>{
    let data = response['data'];
    callback(data);
    times += 1;
    if(times < maxTimes){
      if(typeof(data['nextPageToken']) != "undefined"){
        nestDo(key,videoID,times,maxTimes,callback,data['nextPageToken'],finalCallback)
      }else{
        finalCallback();
      }
    }else{
      finalCallback();
    }
  })
}

function handleRawout(data){
  let comments = [];
  if(items = data['items']){
    items.forEach((item)=>{
      Array.prototype.push.apply(comments,extractCommentInfo(item))
    });
  }
  return comments.filter(comment => comment['timePoints'].length > 0);
}
function extractCommentInfo(item){
  let comments = [];
  Array.prototype.push.apply(comments, handleInfo(item['snippet']['topLevelComment']['snippet']));
  if(item['replies']){
    item['replies']['comments'].forEach((replieItem)=>{
      Array.prototype.push.apply(comments, replieItem['snippet']);
    });
  }
  return comments;
}

function handleInfo(spippet){
  let comments = [];
  let subTextDisplay = spippet['textDisplay'].split('<br />');
  
  if(subTextDisplay.length <= maxCommentLines){
    let comment = {};
    comment['likeCount'] = spippet['likeCount'];
    comment['textDisplay'] = spippet['textDisplay'];
    comment['authorDisplayName'] = spippet['authorDisplayName'];
    comment['authorProfileImageUrl'] = spippet['authorProfileImageUrl'];
    comment['timePoints'] = parseTime(spippet['textDisplay']);
    comment['textOriginal'] = spippet['textOriginal'];
    comment['source'] = 'comment';
    comments.push(comment);
  }else{
    subTextDisplay.forEach((line)=>{
      let comment = {};
      comment['likeCount'] = spippet['likeCount'];
      comment['textDisplay'] = line;
      comment['authorDisplayName'] = spippet['authorDisplayName'];
      comment['authorProfileImageUrl'] = spippet['authorProfileImageUrl'];
      comment['timePoints'] = parseTime(line);
      comment['textOriginal'] = spippet['textOriginal'];
      comment['source'] = 'comment';
      comments.push(comment);
    })
  }
  return comments;
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
function renderCommentsHighLigh(data){
  let comments = handleRawout(data);
  renderBar(comments);
}
function renderBar(comments){
  var duration = player.getDuration();
  var bar = document.getElementsByClassName('ytp-progress-bar')[0];
  var highLighElements = [];
  comments.forEach((comment) =>{
    highLighElements = highLighElements.concat(createHighLights(comment,duration));
  });
  highLighElements.forEach((highLighElement)=>{
    bar.appendChild(highLighElement);
  });
}

function createHighLights(comment,duration){
  var highLighElements = [];
  comment['timePoints'].forEach((timePoint)=> {
    if(timePoint<duration){
      highLighElements.push(createHighLight(timePoint,comment,duration));
    }
  });
  return highLighElements;
}

function createHighLight(timePoint,comment,duration){
  var highLighElement = document.createElement("YTHL");
  var position = Math.round((timePoint/duration) *100);
  highLighElement.likeCount = comment['likeCount'];
  highLighElement.style.left = 'calc('+position+"% "+"- 3px)";
  highLighElement.onclick = function(event){
    event.stopPropagation();
    player.seekTo(timePoint,true);
  };

  highLighElement.classList.add(comment.source);
  highLighElement.onmousedown = function(event){event.stopPropagation();};
  highLighElement.onmouseup = function(event){event.stopPropagation();};
  highLighElement.onmouseover = function(event){ changeTooltipPositon(this);};
  currentLikeCounts.push(highLighElement.likeCount);
  highLighElement.innerHTML = '<div class="tooltip">'+comment['textDisplay'] + '</div>';
  var tooltip = highLighElement.querySelector(".tooltip");
  tooltip.onmousemove = function(event){event.stopPropagation();};
  tooltip.onclick = function(event){event.stopPropagation();};
  return highLighElement;
}
function changeTooltipPositon(highLighElement){
  var currentTooltipLeft = highLighElement.offsetLeft - tooltipSize*0.5;
  var currentTooltipRight = highLighElement.offsetLeft + tooltipSize*0.5;
  var parentWidth = highLighElement.offsetParent.offsetWidth;
  var tooltip = highLighElement.querySelector(".tooltip");
  if(currentTooltipLeft<0){
    tooltip.style.marginLeft = -highLighElement.offsetLeft + "px";
  }else if(currentTooltipRight>parentWidth){
    tooltip.style.marginLeft = -(currentTooltipRight - parentWidth + tooltipSize*0.5) + "px";
  }
}
function getLikeCountRange(){
  currentLikeCounts.sort((a,b)=>{return a-b});
  var range = {};
  var q1 = currentLikeCounts[Math.ceil((currentLikeCounts.length * 0.25))];
  var q3  = currentLikeCounts[Math.floor((currentLikeCounts.length * 0.75))];
  var iqr = q3-q1;
  range.max = q3 + iqr*1.2;
  range.min = q1 - iqr*1.2;
  range.min = (range.min>0)?range.min:0;
  return range;
}

function colorPointByLikeCount(highLighElement,max,min){
  if( (highLighElement.likeCount > max) || max == min){
    highLighElement.style.zIndex = 61;
    highLighElement.style.backgroundColor = "rgb("+maxColor[0]+","+maxColor[1]+","+maxColor[2]+")";
  }else if(highLighElement.likeCount < min){
    highLighElement.style.backgroundColor = "rgb("+minColor[0]+","+minColor[1]+","+minColor[2]+")";
  }else{
    var tintFactor = 1 - ((highLighElement.likeCount-min) / (max-min));
    var r = maxColor[0] + ((minColor[0] - maxColor[0]) * tintFactor);
    var g = maxColor[1] + ((minColor[1] - maxColor[1]) * tintFactor);
    var b = maxColor[2] + ((minColor[2] - maxColor[2]) * tintFactor);
    highLighElement.style.backgroundColor = "rgb("+r+","+g+","+b+")";
  }
}

function colorhighLighElement(){
  let YTHLs = document.querySelectorAll("YTHL.comment");
  let range = getLikeCountRange();
  for(let i=0;i<YTHLs.length;i++){
    let YTHL = YTHLs[i];
    colorPointByLikeCount(YTHL,range.max,range.min);
  }
}

function removeYTHL(){
  var YTHLs = document.getElementsByTagName('YTHL');
  var length = YTHLs.length;
  lastURL = "";
  for(var i=0;i<length;i++){
    let YTHL = YTHLs[0];
    YTHL.parentNode.removeChild(YTHL);
  }
}

function runYTHL(){
  if(document.URL != lastURL){
    lastURL = document.URL;
    currentLikeCounts = [];
    var videoID = re.exec(document.URL)[0];
    while(re.exec(document.URL)){};
    nestDo(YOURAPIKEY,videoID,0,5,renderCommentsHighLigh,"",colorhighLighElement);
  }
}

async function getDescription(){
  let scriptTag = document.getElementById('scriptTag');
  while(!scriptTag){
    scriptTag = document.getElementById('scriptTag');
    await new Promise(r => setTimeout(r, 600));
  }
  return JSON.parse(scriptTag.innerText).description;
}

var timePatternInDescription = /(\d+:)+(\d+)/g;
function parseDescription(description){
  let lines = description.split('\n');
  let comments = [];
  lines.forEach((line)=>{
    let comment = {};
    comment.likeCount = 0;
    comment.textDisplay = line;
    comment.timePoints = parseTimeDesc(line);
    comment.source = 'description';
    comments.push(comment);
  });
  return comments.filter(comment => comment.timePoints.length > 0);
}

function parseTimeDesc(descriptionLine){
  let timePoints = [];
  let digitTime;
  while(digitTime = timePatternInDescription.exec(descriptionLine)){
    timePoints.push(digitTime2Sencond(digitTime[0]));
  }
  return timePoints;
}

function digitTime2Sencond(digitTime){
  var unitInSecond = 0;
  digits = digitTime.split(':').reverse();
  for(let i=0;i<digits.length;i++){
    let value= parseInt(digits[i]);
    switch(i){
      case 3:
        unitInSecond += value * 86400;
        break;
      case 2:
        unitInSecond += value * 3600;
        break;
      case 1:
        unitInSecond += value * 60;
        break;
      case 0:
        unitInSecond += value;
        break;          
    }
  }
  return unitInSecond;
}
function renderDesHighLight(description){
  let comments = parseDescription(description);
  renderBar(comments);
}



function removeYTHL(){
  var YTHLs = document.getElementsByTagName('YTHL');
  var length = YTHLs.length;
  for(var i=0;i<length;i++){
    let YTHL = YTHLs[0];
    YTHL.parentNode.removeChild(YTHL);
  }

}

async function autoRun(){
    let description = await getDescription();
    renderDesHighLight(description);
}

async function setDesNodeObserver(){
  let desNode = document.querySelector('#description yt-formatted-string');
  while(!desNode){
    desNode = document.querySelector('#description yt-formatted-string');
    await new Promise(r => setTimeout(r, 600));
  }
  
  let obs = new MutationObserver(()=>{
    removeYTHL();
    autoRun();
  });
  obs.observe(desNode,{characterData:true,subtree: true, childList: true});
}


setDesNodeObserver();
autoRun();