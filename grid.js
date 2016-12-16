chrome.runtime.sendMessage({type: 'page', category: 'load'}, function(rows) {
    let rowsHtml = '';
    for(let i = 0; i < rows.length; i++){
        if(i>0)
            rowsHtml += ('<tr>'+rows[i].cells.map(x=>`<td>${x}</td>`).join('')+'</tr>');
        else
            document.getElementById('tableheader').innerHTML =  '<tr>'+rows[i].cells.map(x=>`<td>${x}</td>`).join('')+'</tr>';
    }
    document.getElementById('results').innerHTML =  rowsHtml;
});