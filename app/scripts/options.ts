import { IExtensionMessage } from './interfaces/types';

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
      category: 'impersonation',
      type: 'reset',
    });
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

  document.getElementById('impersonate-toggle').addEventListener('change', async function () {
    const checkboxElement = <HTMLInputElement>document.getElementById('impersonate-toggle');
    const checkboxLabel = <HTMLInputElement>document.getElementById('impersonate-cbx-label');

    checkboxLabel.innerHTML = checkboxElement.checked ? 'IMPERSONATING' : '';

    const userName = <HTMLSelectElement>document.getElementById('user-to-impersonate-input');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    const url = tab.url.split('main.aspx')[0];

    const impersonateMessage: IExtensionMessage = <IExtensionMessage>{
      type: 'impersonation',
      category: 'Impersonation',
      content: {
        isActive: checkboxElement.checked,
        userName: userName.value.trim(),
        url: url,
      },
    };

    chrome.runtime.sendMessage(impersonateMessage);
  });
});
