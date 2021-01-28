import { IResultRow, IResultRowKeyValues, IExtensionMessage, ImpersonateMessage } from './interfaces/types';

let content: IResultRow[] | IResultRowKeyValues[][] | ImpersonateMessage | string;
let userId: string;

chrome.storage.local.clear();

chrome.runtime.onMessage.addListener(function (message: IExtensionMessage, sender, sendResponse) {
  if (message.type === 'Page') {
    let c = message.category.toString();
    switch (c) {
      case 'allUsers':
        chrome.tabs.query({ active: true }, function (tabs) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            {
              category: "allUsers",
              type: "Background",
              content: message.content
            }
          )
        });
        break;
      case 'Settings':
        content = message.content;
        chrome.tabs.create({
          url: `/pages/organisationdetails.html`,
        });
        break;
      case 'myRoles':
      case 'allFields':
      case 'quickFindFields':
      case 'entityMetadata':
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
  } else if (message.type === 'Impersonate') {
    let category = message.category;
    let impersonizationMessage = <ImpersonateMessage>message.content;

    switch (category) {
      case 'activation':
        userId = impersonizationMessage.UserId;

        chrome.webRequest.onBeforeSendHeaders.removeListener(headerListener);

        if (impersonizationMessage.IsActive) {
          chrome.webRequest.onBeforeSendHeaders.addListener(
            headerListener,
            {
              urls: [impersonizationMessage.Url + 'api/*']
            },
            ['blocking', 'requestHeaders', 'extraHeaders']
          );
        }
        break;
      case 'changeUser':
        userId = impersonizationMessage.UserId;
        break;
    }
  } else if (message.type === 'API') {
    let c = message.category.toString();
    switch (c) {
      case 'allUsers':
        chrome.tabs.query(
          {
            active: true
          },
          function (tabs) {
            chrome.tabs.executeScript(tabs[0].id, {
              code: `window.postMessage({ type: '${c}', category: '${message.type}' }, '*');`,
            }
            );
          }
        );
        break;
    }
  } else {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true
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

function headerListener(details: chrome.webRequest.WebRequestHeadersDetails) {
  details.requestHeaders.push({
    name: 'MSCRMCallerID',
    value: userId
  });

  return { requestHeaders: details.requestHeaders };
}