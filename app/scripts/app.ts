/// <reference path="types.ts" />
/// <reference path="inject/levelup.common.utility.ts" />
module LevelUp{
    import utility = Common.Utility;
    import types = Types;
    class App{
        isCRMPage: boolean;

        constructor() {
            this.isCRMPage = Array
                            .from(document.scripts)
                            .some(x => x.src.indexOf("/_static/_common/scripts/PageLoader.js") !== -1 
                            || x.src.indexOf("/uclient/scripts/app.js") !== -1
                            || x.src.indexOf("/uclient/scripts/es6-shim.js") !== -1 
                            || x.src.indexOf("/_static/_common/scripts/crminternalutility.js") !== -1);
        }

        start(){
            this.hookupEventListeners();
            if(this.isCRMPage) {
                utility.injectScript(chrome.extension.getURL("Sdk.Soap.min.js"));
                utility.injectScript(chrome.extension.getURL("levelup.extension.js"));
                utility.enableExtension(true);
            }
            else {
                utility.enableExtension(false);
            }
        }

        private hookupEventListeners(){
            document.addEventListener("levelup", (data: types.CustomMessage) => {
                if(data.detail && data.detail.type === "Page"){
                    chrome.runtime.sendMessage(data.detail);
                }
            });

            chrome.runtime.onMessage.addListener((message: types.ExtensionMessage, sender, response) => {
                if(message.type === "VisibilityCheck"){
                    let contentPanels = Array.from(document.querySelectorAll("iframe")).filter(d => {
                        return d.style.visibility !== "hidden" 
                                && d.style.display !== "none"
                    });
                
                    if (contentPanels && contentPanels.length > 0) {
                        let formDocument = contentPanels[0].contentWindow.document;
                        if(formDocument.querySelector("#crmFormHeaderTop") 
                            || document.querySelector('div[data-id="editFormRoot"]')
                            || document.querySelector("#editFormRoot")) {
                            response(types.AreaType.Form);
                        }
                        else if(formDocument.querySelector("span.ms-crm-View-Name") 
                                || document.querySelector("[id^='ViewSelector']")) {
                            response(types.AreaType.Grid);
                        }
                    }
                    else{
                        response(types.AreaType.General);
                    }
                }
            });
        }
    }

    new App().start();
}