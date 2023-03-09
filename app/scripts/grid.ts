chrome.runtime.sendMessage(
  {
    type: 'Page',
    category: 'Load',
  },
  (rows) => {
    const virtualResults = document.createDocumentFragment();
    for (let i = 0; i < rows.length; i++) {
      if (i > 0) {
        const row = document.createElement('tr');
        rows[i].cells.forEach((x, i) => {
          const cell = document.createElement('td');
          cell.className = i % 2 === 0 ? 'name' : 'value';
          cell.innerText = x;
          row.appendChild(cell);
        });
        virtualResults.appendChild(row);
      } else {
        const row = document.createElement('tr');
        rows[i].cells.forEach((x) => {
          const cell = document.createElement('td');
          cell.innerText = x;
          row.appendChild(cell);
        });
        document.getElementById('tableheader').appendChild(row);
      }
    }
    document.getElementById('results').appendChild(virtualResults);
    //@ts-ignore
    new List('grid', {
      valueNames: ['name', 'value'],
    });
  }
);
