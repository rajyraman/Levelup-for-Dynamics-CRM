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
    chrome.runtime.onMessage.addListener(function (message, sender, response) {
        if(message.type === 'visibilityCheck'){
            let contentPanels = Array.from(document.querySelectorAll('iframe')).filter(function (d) {
                return d.style.visibility !== 'hidden'
            });
        
            if (contentPanels && contentPanels.length > 0 && contentPanels[0].contentWindow.document.getElementById('crmFormHeaderTop')) {
                response('form');
            }
            else{
                response('general');
            }
        }
    });
})();