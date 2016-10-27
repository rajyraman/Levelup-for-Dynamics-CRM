chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	if(message.type === 'page') {
		if(message.category === 'settings'){
			chrome.windows.create({
				type : 'panel',
				url : `organisationdetails.html?message=${JSON.stringify(message.content)}`
			});	
		}
		if(message.category === 'userroles'){
			chrome.windows.create({
				type : 'panel',
				url : `grid.html?message=${JSON.stringify(message.content)}`
			});	
		}		
		else if(message.category === 'extension'){
			if(message.content === 'on')
				chrome.browserAction.enable(sender.tab.id);
			else if(message.content === 'off')
				chrome.browserAction.disable(sender.tab.id);
		}
	}
	else {
		chrome.tabs.query({
			active : true,
			currentWindow : true
		}, function (tabs) {
			if(!tabs) return;
			chrome.tabs.executeScript(tabs[0].id, {
				code : `window.postMessage({ type: '${message.type}', category: '${message.category}' }, '*');`
			});
		});
	}
});