chrome.runtime.sendMessage(
  {
    type: 'Page',
    category: 'Load',
  },
  function (response) {
    const cards = response
      .map((r) => {
        const options = r.options
          .map(
            (o) => `<div class="option-item">
            <span class="option-name">${o.text}</span>
            <span class="option-value">${o.value}</span>
          </div>`
          )
          .join('');

        return `<div class="card">
          <div class="card-header">
            <span class="name">${r.name}</span>
          </div>
          <div class="card-content">
            ${options}
          </div>
        </div>`;
      })
      .join('');

    if (response.length > 0) {
      document.getElementById('results').innerHTML = cards;

      new List('grid', {
        valueNames: ['name'],
        searchClass: 'search',
      });
    }
  }
);
