import { IExtensionMessage, LocalStorage, IExtensionLocalStorage } from './interfaces/types';

window.addEventListener('DOMContentLoaded', function () {
  const extensionVersion = chrome.runtime.getManifest().version;
  document.getElementById('version').innerHTML = `v${extensionVersion}`;
  const bodyText = encodeURIComponent(`
    Browser Version: ${navigator.appVersion}
    Extension Version: ${extensionVersion}
    ----------------------------------------------------------
    [DESCRIBE ISSUE HERE]`);
  const issueUrl = `https://github.com/rajyraman/Levelup-for-Dynamics-CRM/issues/new?body=${bodyText}`;
  (<HTMLAnchorElement>document.getElementById('issueUrl')).href = issueUrl;

  document.querySelector('.maincontainer').addEventListener(
    'click',
    function (e) {
      let targetElement = <HTMLButtonElement>(<HTMLElement>e.target).parentElement;
      if (targetElement.localName !== 'button') return;

      let category = targetElement.getAttribute('data-category');
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
      let targetElement = <HTMLDivElement>e.target;

      let category = targetElement.getAttribute('data-category');
      chrome.runtime.sendMessage(<IExtensionMessage>{
        category: category || '',
        type: targetElement.id,
      });
    },
    false
  );
});

