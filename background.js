chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	chrome.tabs.query({
		active : true,
		currentWindow : true
	}, function (tabs) {
		chrome.tabs.executeScript(tabs[0].id, {
			code : `window.postMessage({ type: "${message.type}", extensionId: "${chrome.runtime.id}" }, "*");`
		});
	});
});