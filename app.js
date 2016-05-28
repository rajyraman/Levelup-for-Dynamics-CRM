(function(){
    var injectScript = function(file) {
        var scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'text/javascript');
        scriptTag.setAttribute('src', file);
        document.body.appendChild(scriptTag);
    };
    
    injectScript(chrome.extension.getURL('crmmethods.js'));
    
    document.addEventListener("levelup", function(data) {
        if(data.detail && data.detail.type === 'page'){
            chrome.runtime.sendMessage(data.detail);
        }
    });
})();