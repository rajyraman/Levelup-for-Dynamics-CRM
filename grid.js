window.addEventListener('DOMContentLoaded', function () {
    let rows = JSON.parse(decodeURI(window.location.search.split('&')[0].replace('?message=','')));
    let rowsHtml = '';
    for(let i = 0; i < rows.length; i++){
        if(i>0)
            rowsHtml += ('<tr>'+rows[i].cells.map(x=>`<td>${x}</td>`).join('')+'</tr>');
        else
            document.getElementById('tableheader').innerHTML =  '<tr>'+rows[i].cells.map(x=>`<td>${x}</td>`).join('')+'</tr>';
    }
    document.getElementById('results').innerHTML =  rowsHtml;
});