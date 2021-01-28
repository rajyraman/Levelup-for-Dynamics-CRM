import { IExtensionMessage, LocalStorage, IExtensionLocalStorage } from './interfaces/types';

chrome.runtime.onMessage.addListener((message: IExtensionMessage, sender, response) => {
  if (message.type === 'Page') {
    switch (message.category) {
      case 'allUsers':
        chrome.storage.local.set({
          [LocalStorage.usersList]: message.content,
        });

        populateUsersDropdown(message.content);
        break;
    }
  }
});

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

  document.getElementById('impersonate-toggle').addEventListener('change', function () {
    let checkboxElement = <HTMLInputElement>document.getElementById('impersonate-toggle');
    let checkboxLabel = <HTMLInputElement>document.getElementById('impersonate-cbx-label');

    checkboxLabel.innerHTML = checkboxElement.checked ? 'IMPERSONATING' : '';

    let selectedUser = (<HTMLSelectElement>document.getElementById('users-dropdown'));

    chrome.tabs.query({ active: true }, function (tabs) {
      var url = tabs[0].url.split('main.aspx')[0];

      let msg: IExtensionMessage = <IExtensionMessage>{
        type: 'Impersonate',
        category: 'activation',
        content: {
          IsActive: checkboxElement.checked,
          UserId: selectedUser.value,
          Url: url,
        },
      };

      chrome.storage.local.set({
        [LocalStorage.isImpersonating]: checkboxElement.checked,
        [LocalStorage.userName]: selectedUser.options[selectedUser.selectedIndex].text
      });

      chrome.runtime.sendMessage(msg);
    });
  });

  document.getElementById('users-dropdown').addEventListener('change', function () {
    let userId = (<HTMLSelectElement>document.getElementById('users-dropdown')).value;
    let checboxElement = <HTMLInputElement>document.getElementById('impersonate-toggle');

    let checked = checboxElement.checked;

    let msg: IExtensionMessage = <IExtensionMessage>{
      type: 'Impersonate',
      category: 'changeUser',
      content: {
        IsActive: checked,
        UserId: userId,
      },
    };

    chrome.storage.local.set({
      [LocalStorage.userId]: userId,
    });

    chrome.runtime.sendMessage(msg);
  });

  initImpersonateTab();
});

function initImpersonateTab() {
  chrome.storage.local.get([LocalStorage.usersList], function (result: IExtensionLocalStorage) {
    let users = result.usersList;

    if (!users) {
      chrome.runtime.sendMessage({
        category: 'allUsers',
        type: 'API',
      });
    } else {
      populateUsersDropdown(users);
    }
  });
}

function populateUsersDropdown(users) {
  let select = <HTMLSelectElement>document.getElementById('users-dropdown');

  while (select.firstChild) {
    select.removeChild(select.lastChild);
  }

  for (var i = 0; i < users.length; i++) {
    let opt = document.createElement('option');
    opt.value = users[i].azureactivedirectoryobjectid;
    opt.innerHTML = users[i].fullname;
    select.appendChild(opt);
  }

  setSavedValues();
}

function setSavedValues() {
  chrome.storage.local.get([LocalStorage.userId, LocalStorage.isImpersonating], function (
    result: IExtensionLocalStorage
  ) {
    let isImpersonating = result.isImpersonating || false;
    let userId = result.userId;

    let selectElement = <HTMLInputElement>document.getElementById('impersonate-toggle');

    if (isImpersonating) {
      selectElement.parentElement.classList.add('is-checked');
    } else {
      selectElement.parentElement.classList.remove('is-checked');
    }

    selectElement.checked = isImpersonating;
    (<HTMLInputElement>document.getElementById('impersonate-cbx-label')).innerHTML = selectElement.checked
      ? 'IMPERSONATING'
      : '';

    let dropdown = <HTMLSelectElement>document.getElementById('users-dropdown');
    dropdown.value = userId;

    if (userId) {
      dropdown.parentElement.classList.add('is-dirty');
    }
  });
}
