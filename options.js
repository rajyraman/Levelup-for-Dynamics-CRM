document.getElementById('crmHelperLinks').addEventListener('click',function(e){
    chrome.runtime.sendMessage({
        type:e.target.id
    });
}, false); 

chrome.runtime.onConnect.addListener(function(port) {
  port.onMessage.addListener(function(message) {
      alert(`options received ${message.clipboardContent} from ${sender.tab}`);
  });
});