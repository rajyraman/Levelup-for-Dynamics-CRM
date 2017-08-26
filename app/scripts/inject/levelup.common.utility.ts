/// <reference path="../types.ts" />
module LevelUp {
    export module Common {
        export class Utility {
            private _is2016: boolean;
            private _currentUserId: string;

            constructor(private _document: Document,
                private _window: Window,
                private _xrm: Xrm.XrmStatic,
                private _clientUrl: string) {
                let version = _xrm.Page.context.getVersion ? _xrm.Page.context.getVersion() : <string>window["APPLICATION_VERSION"];
                this._is2016 = version.startsWith('8');
                this._currentUserId = _xrm.Page.context.getUserId().substr(1, 36)
            }

            public get formDocument(): Document { return this._document; }

            public get formWindow(): Window { return this._window; }

            public get Xrm(): Xrm.XrmStatic { return this._xrm; }

            public get clientUrl(): string { return this._clientUrl; }

            public get is2016(): boolean {
                return this._is2016;
            }

            public get currentUserId(): string {
                return this._currentUserId;
            }

            fetch(entityName: string, attributes?: string, filter?: string): Promise<Array<any>> {
                let headers = new Headers({
                    "Accept": "application/json",
                    "Content-Type": "application/json; charset=utf-8",
                });
                let serviceUrl = `${this.clientUrl}/XRMServices/2011/OrganizationData.svc/${entityName}`;
                if (this.is2016) {
                    headers = new Headers({
                        "Accept": "application/json",
                        "Content-Type": "application/json; charset=utf-8",
                        "OData-MaxVersion": "4.0",
                        "OData-Version": "4.0"
                    });
                    serviceUrl = `${this.clientUrl}/api/data/v8.0/${entityName}`;
                }
                if (attributes) {
                    serviceUrl += `?$select=${attributes}`;
                }
                if (filter) {
                    serviceUrl += `&$filter=${filter}`;
                }
                return fetch(serviceUrl, {
                    method: 'GET',
                    headers: headers,
                    credentials: 'include'
                }).then((response) => {
                    return response.json();
                }).then((c) => {
                    if (c.d) {
                        return c.d.results;
                    }
                    else if (c.value) {
                        return c.value;
                    }
                }).catch((err) => {
                    console.log(err);
                });
            }

            messageExtension(message: any[], category: Types.Category): void {
                let extensionMessage = {
                    type: "Page",
                    category: category,
                    content: message
                };

                let levelUpEvent = new CustomEvent('levelup', {
                    detail: extensionMessage,
                });
                levelUpEvent.initEvent('levelup', false, false);
                document.dispatchEvent(levelUpEvent);
            }

            static injectScript(file): void {
                var scriptTag = document.createElement('script');
                scriptTag.setAttribute('type', 'text/javascript');
                scriptTag.setAttribute('src', file);
                document.body.appendChild(scriptTag);
            };

            static enableExtension(isEnable: boolean): void {
                chrome.runtime.sendMessage({
                    type: "Page",
                    content: isEnable ? Types.ExtensionState.On : Types.ExtensionState.Off,
                    category: "Extension"
                });
            }

            static copy(valueToCopy): void {
                var t = document.createElement('input');
                t.setAttribute('id', 'copy');
                t.setAttribute('value', valueToCopy);
                document.body.appendChild(t);
                t.select();
                document.execCommand('copy');
                t.remove();
            }
        }
    }
}