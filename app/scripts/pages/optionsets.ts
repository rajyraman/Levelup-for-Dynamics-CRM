/// <reference path="../../tsd/externals.d.ts" />
chrome.runtime.sendMessage(
  {
    type: 'Page',
    category: 'Load',
  },
  function (response) {
    let rows = response
      .map((r) => {
        let cells = `<td class="name">${r.name}</td>
                    <td>
                    <table>
                    <thead>
                    <tr><th>Name</th><th>Value</th></tr>
                    </thead>
                    <tbody>
                    ${r.options.map((o) => '<tr><td>' + o.text + '</td><td>' + o.value + '</td></tr>').join('')}
                    </tbody>
                    </table>
                    </td>`;
        return `<tr>${cells}</tr>`;
      })
      .join('');
    if (response.length > 0) {
      document.getElementById('results').innerHTML = rows;
      new List('grid', {
        valueNames: ['name'],
      });
    }
  }
);
