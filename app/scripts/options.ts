import { IExtensionMessage, UserDetail } from './interfaces/types';

window.addEventListener('DOMContentLoaded', function () {
  let drawerButton = document.querySelector(".mdl-layout__drawer-button") as HTMLElement;
  if (drawerButton) {
    drawerButton.title = "Admin Area";

    let drawerButtonIcon = drawerButton.querySelector("i") as HTMLElement;
    drawerButtonIcon?.setAttribute("aria-hidden", "true");
  }

  let optionButtons = document.querySelectorAll(".mdl-button");
  if (optionButtons.length > 0) {
    for(let i = 0; i < optionButtons.length; i++) {
      let oButton = optionButtons[i] as HTMLButtonElement;
      let tooltip = oButton?.parentElement?.querySelector(".mdl-tooltip");
      if (tooltip && oButton.id?.length > 0) {
        tooltip.id = oButton.id + "-tooltip";
        oButton?.setAttribute("aria-describedby", tooltip.id);
      }
    }
  }
});

window.addEventListener('DOMContentLoaded', function () {
  const extensionVersion = chrome.runtime.getManifest().version;
  document.getElementById('version').innerHTML = `v${extensionVersion}`;

  const bodyText = encodeURIComponent(`
    Browser Version: ${navigator}
    Extension Version: ${extensionVersion}
    ----------------------------------------------------------
    [DESCRIBE ISSUE HERE]`);
  const issueUrl = `https://github.com/rajyraman/Levelup-for-Dynamics-CRM/issues/new?body=${bodyText}`;
  (<HTMLAnchorElement>document.getElementById('issueUrl')).href = issueUrl;
  document.querySelector('#resetImpersonationButton').addEventListener('click', function (e) {
    chrome.runtime.sendMessage(<IExtensionMessage>{
      category: 'Impersonation',
      type: 'reset',
    });
  });

  chrome.runtime.onMessage.addListener(async function (message: IExtensionMessage) {
    if (message.type !== 'search' || message.category !== 'Impersonation') return;
    const users = <UserDetail[]>message.content;

    if (users.length > 0) document.querySelector('#startImpersonationButton').removeAttribute('disabled');
    document.querySelector('datalist#userList').innerHTML = users
      .map((u) => `<option label="${u.fullName}" value="${u.userName}"></option>`)
      .join('');
  });

  document.querySelector('#environmentLinks').addEventListener(
    'click',
    function (e) {
      const targetElement = <HTMLDivElement>e.target;

      const category = targetElement.getAttribute('data-category');
      chrome.runtime.sendMessage(<IExtensionMessage>{
        category: category || '',
        type: targetElement.id,
      });
    },
    false
  );
  document.querySelector('#impersonate-tab').addEventListener('click', async (e) => {
    e.stopPropagation();
    e.preventDefault();
    const targetElement = <HTMLButtonElement>(<HTMLElement>e.target).parentElement;
    if (targetElement.localName !== 'button') return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    const url = `${new URL(tab.url).origin}/`;
    const userName = <HTMLInputElement>document.getElementById('user-to-impersonate-input');
    let impersonateMessage: IExtensionMessage;
    switch (targetElement.id) {
      case 'searchUserButton':
        impersonateMessage = {
          category: 'Impersonation',
          type: 'search',
          content: {
            userName: userName.value.trim(),
          },
        };
        break;
      case 'startImpersonationButton':
        impersonateMessage = {
          category: 'Impersonation',
          type: 'impersonation',
          content: {
            isActive: true,
            userName: userName.value.trim(),
            url: url,
          },
        };
        break;
      case 'resetImpersonationButton':
        impersonateMessage = {
          category: 'Impersonation',
          type: 'reset',
        };
        break;
    }
    chrome.runtime.sendMessage(impersonateMessage);
  });

  document.querySelector('.maincontainer').addEventListener(
    'click',
    function (e) {
      const targetElement = <HTMLButtonElement>(<HTMLElement>e.target).parentElement;
      if (targetElement.localName !== 'button') return;

      const category = targetElement.getAttribute('data-category');
      chrome.runtime.sendMessage(<IExtensionMessage>{
        category: category || '',
        type: targetElement.id,
      });
    },
    false
  );
});
