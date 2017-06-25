function setVisibility(areaName){
    document.querySelectorAll('.forms').forEach(x=> x.style.display = areaName !== 'form' ? 'none' : 'flex');
    document.querySelectorAll('.grid').forEach(x=> x.style.display = areaName !== 'grid' ? 'none' : 'flex');
}

document.getElementById('crmHelperLinks').addEventListener('click',function(e){
    let category = e.target.parentNode.getAttribute('data-category');
    
    chrome.runtime.sendMessage({
        type:e.target.id,
        category: category
    });
}, false);

window.addEventListener('DOMContentLoaded', function () {
  document.getElementById('version').innerHTML = `v${chrome.runtime.getManifest().version}`;
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function (tabs) {
    chrome.tabs.sendMessage(
        tabs[0].id,
        { type: 'visibilityCheck' },
        setVisibility);
  });
});