var content = [];
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	if(message.type === 'page') {
		switch (message.category) {
			case 'settings':
				content = message.content;
				chrome.tabs.create({
					url : `organisationdetails.html`
				});					
				break;
			case 'myRoles':
			case 'allfields':
			case 'quickFindFields':						
				content = message.content;
				chrome.tabs.create({
					url : `grid.html`
				});					
				break;			
			case 'workflows':
				content = message.content;
				chrome.tabs.create({
					url : `processes.html`
				});					
				break;				
			case 'extension':
				if(message.content === 'on')
					chrome.browserAction.enable(sender.tab.id);
				else if(message.content === 'off')
					chrome.browserAction.disable(sender.tab.id);				
				break;		
			case 'load':
				sendResponse(content);
				break;	
			case 'allUserRoles':
				content = message.content;
				chrome.tabs.create({
					url : `userroles.html`
				});					
				break;														
			default:
				break;
		}
	}
	else {
		chrome.tabs.query({
			active : true,
			currentWindow : true
		}, function (tabs) {
			if(!tabs || tabs.length === 0) return;
			chrome.tabs.executeScript(tabs[0].id, {
				code : `window.postMessage({ type: '${message.type}', category: '${message.category}' }, '*');`
			});
		});
	}
});