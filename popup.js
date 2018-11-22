// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';


function injectScript(tab){
  chrome.tabs.executeScript(tab.id,{file:"injector.js"});
}
chrome.pageAction.onClicked.addListener(injectScript);
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
  var isTitleChanged = (changeInfo.title)?true:false;
  if (tab.id == tabId && isTitleChanged){
    chrome.tabs.executeScript(tab.id,{code:"removeYTHL();"});
  }
});
