chrome.runtime.sendMessage({type: 'page', category: 'load'}, function(response) {
    let rows = response
    .map(x=> {
      if(typeof x.value === 'boolean') {
       x.value = x.value ? 'Yes' : 'No'; 
      }
      return `<tr><td>${x.name}</td><td>${x.value}</td></tr>` 
    })
    .sort()
    .join('');
    
    document.getElementById('results').innerHTML =  rows;
});