document.getElementById('crmHelperLinks').addEventListener('click',function(e){
    let category = e.target.parentNode.getAttribute('data-category');
    
    chrome.runtime.sendMessage({
        type:e.target.id,
        category: category
    });
}, false);