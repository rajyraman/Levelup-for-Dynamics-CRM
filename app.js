(function(){
    var injectScript = function(file) {
        var scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'text/javascript');
        scriptTag.setAttribute('src', file);
        document.body.appendChild(scriptTag);
    };
    if(Array.from(document.scripts).some(x=>x.src.indexOf('_common/entityproperties/entitypropertiesutil') !== -1)){
        injectScript(chrome.extension.getURL('Sdk.Soap.min.js'));
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
        
            if (contentPanels && contentPanels.length > 0) {
                let formDocument = contentPanels[0].contentWindow.document;
                if(formDocument.getElementById('crmFormHeaderTop')){
                    response('form');
                }
                else if(formDocument.querySelector('span.ms-crm-View-Name')){
                    response('grid');
                }
            }
            else{
                response('general');
            }
        }
    });
})();