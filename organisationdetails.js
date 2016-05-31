window.addEventListener('DOMContentLoaded', function () {
    let settings = JSON.parse(decodeURI(window.location.search.split('&')[0].replace('?message=','')));
    let rows = settings
    .slice(1)
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