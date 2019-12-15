
importYTHLScriptCSS();
function importYTHLScriptCSS(){
    if(!document.YTHL){
        document.YTHL = true;
        importCSS('YTHL.css');
        importScriptToDom('axios.min.js',()=>{
            importScriptToDom('injectYT.js');
        });
    }
}

function importScriptToDom(scriptName,callback){
    var s1 = document.createElement('script');
    s1.src = chrome.extension.getURL(scriptName);
    (document.head||document.documentElement).appendChild(s1);
    s1.onload = function() {
        s1.parentNode.removeChild(s1);
        if(callback) callback();
    }
}

function runScriptInDom(code,callback){
    var s1 = document.createElement('script');
    s1.text = code;
    (document.head||document.documentElement).appendChild(s1);
    s1.onload = function() {
        s1.parentNode.removeChild(s1);
        if(callback) callback();
    }
}

function importCSS(cssName,callback){
    var s1 = document.createElement('link');
    s1.type = "text/css";
    s1.rel = "stylesheet";
    s1.href = chrome.extension.getURL(cssName);
    (document.head||document.documentElement).appendChild(s1);
}
