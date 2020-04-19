import { IResultRow, IResultRowKeyValues, IExtensionMessage } from './interfaces/types';

let content: IResultRow[] | IResultRowKeyValues[][] | string;
chrome.runtime.onMessage.addListener(function (message: IExtensionMessage, sender, sendResponse) {
  if (message.type === 'Page') {
    let c = message.category.toString();
    switch (c) {
      case 'Settings':
        content = message.content;
        chrome.tabs.create({
          url: `/pages/organisationdetails.html`,
        });
        break;
      case 'myRoles':
      case 'allFields':
      case 'quickFindFields':
      case 'environment':
        content = message.content;
        chrome.tabs.create({
          url: `/pages/grid.html`,
        });
        break;
      case 'workflows':
        content = message.content;
        chrome.tabs.create({
          url: `/pages/processes.html`,
        });
        break;
      case 'Extension':
        if (message.content === 'On') chrome.browserAction.enable(sender.tab.id);
        else if (message.content === 'Off') chrome.browserAction.disable(sender.tab.id);
        break;
      case 'Load':
        sendResponse(content);
        break;
      case 'allUserRoles':
        content = message.content;
        chrome.tabs.create({
          url: `/pages/userroles.html`,
        });
        break;
      case 'optionsets':
        content = message.content;
        chrome.tabs.create({
          url: `/pages/optionsets.html`,
        });
        break;
      default:
        break;
    }
  } else {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      function (tabs) {
        if (!tabs || tabs.length === 0) return;
        chrome.tabs.executeScript(tabs[0].id, {
          code: `window.postMessage({ type: '${message.type}', category: '${message.category}' }, '*');`,
        });
      }
    );
  }
});
