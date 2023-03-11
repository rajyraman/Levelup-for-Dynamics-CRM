import {
  IExtensionMessage,
  IImpersonationResponse,
  ExtensionMessageContent,
  IImpersonateMessage,
  ImpersonationStorage,
} from './interfaces/types';

let userId: string;
let content: ExtensionMessageContent;

chrome.runtime.onMessage.addListener(async function (
  message: IExtensionMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse
) {
  if (message.type === 'Page') {
    const c = message.category;
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
        renderBadge();
        if (message.content === 'On') {
          chrome.action.enable(sender.tab.id);
        } else if (message.content === 'Off') chrome.action.disable(sender.tab.id);
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
      case 'Impersonation':
        const impersonationResponse = <IImpersonationResponse>message.content;
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (!tab || impersonationResponse.users.length === 0) return;
        if (impersonationResponse.users.length > 1) {
          chrome.runtime.sendMessage(<IExtensionMessage>{
            type: 'search',
            category: 'Impersonation',
            content: impersonationResponse.users,
          });
        } else {
          userId = impersonationResponse.users[0].userId;

          chrome.storage.local.set({
            [impersonationResponse.impersonateRequest.url]: <ImpersonationStorage>{
              isImpersonationActive: impersonationResponse.impersonateRequest.isActive,
              userName: impersonationResponse.impersonateRequest.userName,
              userFullName: impersonationResponse.users[0].fullName,
            },
          });
          if (impersonationResponse.impersonateRequest.isActive) {
            chrome.declarativeNetRequest.updateDynamicRules(
              {
                removeRuleIds: [1],
                addRules: [
                  {
                    id: 1,
                    priority: 1,
                    action: {
                      type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
                      requestHeaders: [
                        {
                          header: 'CallerObjectId',
                          operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                          value: userId,
                        },
                      ],
                    },
                    condition: {
                      regexFilter: `${impersonationResponse.impersonateRequest.url}api/*`,
                      resourceTypes: [
                        chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
                        chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
                        chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
                      ],
                    },
                  },
                ],
              },
              async () => {
                renderBadge(impersonationResponse.impersonateRequest.url);
              }
            );
          } else {
            chrome.declarativeNetRequest.getDynamicRules((rules) => {
              const ruleIds = rules.map((x) => x.id);
              chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: ruleIds,
              });
            });
            chrome.storage.local.clear();
          }
          chrome.tabs.reload(tab.id, { bypassCache: true });
        }
        break;
      default:
        break;
    }
  } else if (message.type === 'reset') {
    chrome.declarativeNetRequest.getDynamicRules((rules) => {
      const ruleIds = rules.map((x) => x.id);
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIds,
      });
    });
    chrome.storage.local.clear();
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab) return;
    chrome.tabs.reload(tab.id, { bypassCache: true });
  } else if (message.type === 'impersonation' || message.type === 'search') {
    const impersonizationMessage = <IImpersonateMessage>message.content,
      [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: postExtensionMessageWithData,
      args: [message.type.toString(), message.category.toString(), impersonizationMessage],
    });
  } else {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: postExtensionMessage,
      args: [message.type.toString(), message.category.toString()],
    });
  }
});

async function renderBadge(url?: string) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;

  if (!url) url = `${new URL(tab.url).origin}/`;
  const localSettingForEnv: ImpersonationStorage = (await chrome.storage.local.get(url))[url];
  if (!localSettingForEnv) {
    chrome.action.setBadgeBackgroundColor({ color: [0, 0, 0, 0] });
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setTitle({ title: '' });
    return;
  }
  if (localSettingForEnv.isImpersonationActive) {
    chrome.action.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
    chrome.action.setTitle({ title: `Impersonating ${localSettingForEnv.userName}` });
    chrome.action.setBadgeText({
      text: localSettingForEnv.userFullName,
    });
  }
}

function postExtensionMessage(message: string, category: string) {
  window.postMessage({ type: message, category: category }, '*');
}

function postExtensionMessageWithData(message: string, category: string, data: object) {
  window.postMessage({ type: message, category: category, content: data }, '*');
}
