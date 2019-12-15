'use strict';


function execYTHL(tab){
  chrome.tabs.executeScript(tab.id,{code:"runScriptInDom('runYTHL()');"});
}
chrome.pageAction.onClicked.addListener(execYTHL);


var YTURLPatten = /.*?www.youtube.com\/watch\?.*/g;
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
  if(tab.url.match(YTURLPatten)){
    chrome.tabs.executeScript(tab.id,{file:"injector.js"});
  }
});