document.getElementById('crmHelperLinks').addEventListener('click',function(e){
    chrome.runtime.sendMessage({
        type:e.target.id
    });
}, false);