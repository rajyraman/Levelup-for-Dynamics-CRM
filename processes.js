chrome.runtime.sendMessage({type: 'page', category: 'load'}, function(response) {
    let rows = response
    .map(r=> {
        var cells = r.map((c,i)=>{
            if(i === 0) return '';
            return i !== 1 ? `<td>${c}</td>` : `<td><a target="_blank" href="${r[0]}">${c}</a></td>`;
        }).join('');
        return `<tr>${cells}</tr>`;
    })
    .join('');
    if(response.length > 0){
        document.getElementById('results').innerHTML =  rows;
    }
});