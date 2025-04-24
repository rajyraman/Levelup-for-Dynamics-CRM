import { IExtensionMessage, UserDetail } from './interfaces/types';

interface SearchableOption {
  id: string;
  category: string;
  text: string;
  tooltip: string;
  icon: string;
}

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

  // Initialize search functionality
  const searchInput = document.getElementById('search') as HTMLInputElement;
  const searchResults = document.getElementById('search-results');
  const mainMenu = document.getElementById('main-menu');
  const allOptions: SearchableOption[] = [];

  // Collect all menu options from the page
  document.querySelectorAll('button[data-category]').forEach((button) => {
    const category = button.getAttribute('data-category');
    const id = button.id;
    const text = button.querySelector('span')?.textContent || '';
    const tooltip = button.nextElementSibling?.textContent || '';
    const icon = button.querySelector('i')?.textContent || '';

    allOptions.push({ id, category, text, tooltip, icon });
  });

  // Handle search input
  searchInput.addEventListener('input', (e) => {
    const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();

    if (searchTerm.length < 2) {
      searchResults.style.display = 'none';
      mainMenu.style.display = 'block';
      return;
    }

    const matches = allOptions.filter((option) => option.text.toLowerCase().includes(searchTerm));

    if (matches.length > 0) {
      searchResults.innerHTML = matches
        .map(
          (option) => `
        <div class="mdl-cell mdl-cell--4-col">
          <button data-category="${option.category}" id="${option.id}" class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent">
            <i class="material-icons">${option.icon}</i>
            <span>${option.text}</span>
          </button>
          <div class="mdl-tooltip" data-mdl-for="${option.id}">
            ${option.tooltip}
          </div>
        </div>
      `
        )
        .join('');
      searchResults.style.display = 'flex';
      mainMenu.style.display = 'none';
    } else {
      searchResults.style.display = 'none';
    }
  });

  // Handle search result clicks
  searchResults.addEventListener('click', (e) => {
    const targetElement = (e.target as HTMLElement).closest('button');
    if (!targetElement) return;

    const category = targetElement.getAttribute('data-category');
    chrome.runtime.sendMessage(<IExtensionMessage>{
      category: category || '',
      type: targetElement.id,
    });
  });

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
