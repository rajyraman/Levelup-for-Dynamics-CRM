var entityName = prompt("Entity?", ""), entityId = prompt("Id?", "");
var url = Xrm.Page.context.getClientUrl() + '/main.aspx?etn=' + entityName + '&id=' + entityId + '&newWindow=true&pagetype=entityrecord';
window.open(url, '_blank');
chrome.runtime.onMessage.addListener(function(msg, _, sendResponse) {
    alert(msg);
    alert(Xrm);
});