(function(){
    var injectScript = function(file) {
        var scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'text/javascript');
        scriptTag.setAttribute('src', file);
        document.body.appendChild(scriptTag);
    };
    if(Array.from(document.scripts).findIndex(x=>x.id.startsWith('/_static/_common/scripts/ribbonactions.js')) !== -1){
        injectScript(chrome.extension.getURL('crmmethods.js'));
        chrome.runtime.sendMessage({
            type: 'page',
            content: 'on',
            category: 'extension'
        });
    }
    else{
        chrome.runtime.sendMessage({
            type: 'page',
            content: 'off',
            category: 'extension'
        });
    }
    document.addEventListener("levelup", function(data) {
        if(data.detail && data.detail.type === 'page'){
            chrome.runtime.sendMessage(data.detail);
        }
    });
})();