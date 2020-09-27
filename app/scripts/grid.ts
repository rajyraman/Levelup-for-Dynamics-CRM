/// <reference path="../tsd/externals.d.ts" />
chrome.runtime.sendMessage(
  {
    type: 'Page',
    category: 'Load',
  },
  (rows) => {
    let rowsHtml = '';
    for (let i = 0; i < rows.length; i++) {
      if (i > 0)
        rowsHtml +=
          '<tr>' +
          rows[i].cells
            .map((x, i) => {
              return `<td class=${i % 2 === 0 ? 'name' : 'value'}>${x || ''}</td>`;
            })
            .join('') +
          '</tr>';
      else
        document.getElementById('tableheader').innerHTML =
          '<tr>' + rows[i].cells.map((x) => `<td>${x}</td>`).join('') + '</tr>';
    }
    document.getElementById('results').innerHTML = rowsHtml;
    new List('grid', {
      valueNames: ['name', 'value'],
    });
  }
);
