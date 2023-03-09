chrome.runtime.sendMessage(
  {
    type: 'Page',
    category: 'Load',
  },
  function (response) {
    const rows = response
      .map((r) => {
        const cells = r
          .map((c, i) => {
            if (i === 0) return '';
            return i !== 1
              ? `<td>${c.value}</td>`
              : `<td class='name'><a target="_blank" href="${r[0].value}">${c.value}</a></td>`;
          })
          .join('');
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
