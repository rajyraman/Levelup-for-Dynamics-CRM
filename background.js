chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	if(message.type === 'page') {
		//alert(message.content);	
	}
	else {
		chrome.tabs.query({
			active : true,
			currentWindow : true
		}, function (tabs) {
			chrome.tabs.executeScript(tabs[0].id, {
				code : `window.postMessage({ type: "${message.type}", category: "${message.category}" }, "*");`
			});
		});
	}
});