/// <reference path="../../types.ts" />
/// <reference path="../../../tsd/externals.d.ts" />
chrome.runtime.sendMessage({
    type: "Page",
    category: "Load"
}, function(rows) {
    let rowsHtml = '';
    for(let i = 0; i < rows.length; i++){
        if(i>0)
            rowsHtml += ('<tr>'+Object.keys(rows[i]).map((x)=>{
                return `<td><a href='${rows[i][x].url}' target='_blank' rel='noopener' class='${x.indexOf('user') > -1 ? 'user' : 'role'}'>${rows[i][x].name}</a></td>`;
            }).join('')+'</tr>');
        else
            document.getElementById('tableheader').innerHTML =  '<tr>'+rows[i].cells.map(x=>`<td>${x}</td>`).join('')+'</tr>';
    }
    document.getElementById('results').innerHTML =  rowsHtml;
    new List('grid', { 
        valueNames: [ 'user', 'role' ]
    });
});