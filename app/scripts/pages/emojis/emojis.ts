
chrome.runtime.sendMessage({
    type: "Page",
    category: "Load"
}, function(response) {
    new List('grid', { 
        valueNames: ['description']
    });
    document.querySelector('table').addEventListener('click', (e) =>{
       let clickedButton = (<HTMLElement>e.target);
       if(clickedButton.tagName === 'BUTTON'){
        copyTextToClipboard(clickedButton.parentNode.parentNode.querySelector('td:first-child').innerHTML);
       };
    }); 
});