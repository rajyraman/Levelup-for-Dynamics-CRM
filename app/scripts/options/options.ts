/// <reference path="../types.ts" />
module LevelUp {
    function setVisibility(areaName: Types.AreaType){
        document.querySelectorAll('.forms').forEach((x: HTMLElement) => x.style.display = areaName !== Types.AreaType.Form ? 'none' : 'flex');
        document.querySelectorAll('.grid').forEach((x: HTMLElement) => x.style.display = areaName !== Types.AreaType.Grid ? 'none' : 'flex');
    }

    document.getElementById('crmHelperLinks').addEventListener('click',function(e){
        let targetElement = <HTMLElement>e.target;
        let category = (<HTMLElement>targetElement.parentNode).getAttribute('data-category');
        chrome.runtime.sendMessage(<Types.ExtensionMessage>{
            category: category,
            type: targetElement.id
        });
    }, false);

    window.addEventListener('DOMContentLoaded', function () {
    document.getElementById('version').innerHTML = `v${chrome.runtime.getManifest().version}`;
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        chrome.tabs.sendMessage(
            tabs[0].id,
            <Types.ExtensionMessage>{ 
                type: "VisibilityCheck"
            },
            setVisibility);
    });
    });
}