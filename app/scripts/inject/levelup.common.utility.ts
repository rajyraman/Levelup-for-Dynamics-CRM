import * as WebApiClient from "xrm-webapi-client";

import {
  IRetrieveCurrentOrganizationResponseDetail,
  Category,
  IRetrieveCurrentOrganizationResponse,
} from '../interfaces/types';

export class Utility {
  private _is2016OrGreater: boolean;
  private _currentUserId: string;
  private _version: string;
  private _environmentDetail: IRetrieveCurrentOrganizationResponseDetail;

  constructor(
    private _document: Document,
    private _window: Window,
    private _xrm: Xrm.XrmStatic,
    private _clientUrl: string
  ) {
    let version = _xrm.Page.context.getVersion ? _xrm.Page.context.getVersion() : <string>window['APPLICATION_VERSION'];
    this._is2016OrGreater = version.startsWith('8') || version.startsWith('9');
    this._currentUserId = _xrm.Page.context.getUserId().substr(1, 36);
    this._version = version;
  }

  public get environmentDetail(): IRetrieveCurrentOrganizationResponseDetail {
    return this._environmentDetail;
  }

  public get formDocument(): Document {
    return this._document;
  }

  public get formWindow(): Window {
    return this._window;
  }

  public get Xrm(): Xrm.XrmStatic {
    return this._xrm;
  }

  public get clientUrl(): string {
    return this._clientUrl;
  }

  public get clientUrlForParams(): string {
    return this._clientUrl + (this._clientUrl.indexOf('appid') > -1 ? '&' : '/main.aspx?');
  }

  public get is2016OrGreater(): boolean {
    return this._is2016OrGreater;
  }

  public get currentUserId(): string {
    return this._currentUserId;
  }

  public get version(): string {
    return this._version;
  }

  public get isOnline(): boolean {
    return (
      (this._xrm.Page.context.isOffice365 && this._xrm.Page.context.isOffice365()) ||
      (this._xrm.Page.context.isOnPremises && !this._xrm.Page.context.isOnPremises())
    );
  }

  fetch(entityName: string, attributes?: string, filter?: string, id?: string, fetchXML?: string) {
    let headers = new Headers({
      Accept: 'application/json',
      'Content-Type': 'application/json; charset=utf-8',
    });
    let serviceUrl = `${Xrm.Page.context.getClientUrl()}/XRMServices/2011/OrganizationData.svc/${entityName}`;
    if (this._is2016OrGreater) {
      headers = new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        Prefer: 'odata.include-annotations="*"',
      });
      serviceUrl = `${Xrm.Page.context.getClientUrl()}/api/data/v${Xrm.Page.context
        .getVersion()
        .substr(0, 3)}/${entityName}`;
    }
    if (id) {
      serviceUrl += `(${id})`;
    }
    if (attributes) {
      serviceUrl += `?$select=${attributes}`;
    }
    if (filter) {
      serviceUrl += `&$filter=${filter}`;
    }
    if (fetchXML) {
      serviceUrl += `?fetchXml=${encodeURI(fetchXML)}`;
    }
    return fetch(serviceUrl, {
      method: 'GET',
      headers: headers,
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((c) => {
        if (c.d) {
          return c.d.results;
        } else if (c.value) {
          return c.value;
        }
        return c;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  messageExtension(message: any[] | boolean, category: Category): void {
    let extensionMessage = {
      type: 'Page',
      category: category,
      content: message,
    };

    let levelUpEvent = new CustomEvent('levelup', {
      detail: extensionMessage,
    });
    levelUpEvent.initEvent('levelup', false, false);
    document.dispatchEvent(levelUpEvent);
  }

  static injectScript(file): void {
    let scriptTag = document.createElement('script');
    scriptTag.setAttribute('type', 'text/javascript');
    scriptTag.setAttribute('src', file);
    document.body.appendChild(scriptTag);
  }

  static enableExtension(isEnable: boolean): void {
    chrome.runtime.sendMessage({
      type: 'Page',
      content: isEnable ? 'On' : 'Off',
      category: 'Extension',
    });
  }

  static copy(valueToCopy): void {
    let t = document.createElement('input');
    t.setAttribute('id', 'copy');
    t.setAttribute('value', valueToCopy);
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    t.remove();
  }

  async retrieveEnvironmentDetails() {
    // @ts-ignore
    const request = WebApiClient.Requests.RetrieveCurrentOrganizationRequest.with({
      urlParams: {
        AccessType: `Microsoft.Dynamics.CRM.EndpointAccessType'Default'`,
      },
    });
    try {
      this._environmentDetail = (<IRetrieveCurrentOrganizationResponse>await WebApiClient.Execute(request)).Detail;
    } catch (e) {
      console.warn('Level up: No RetrieveCurrentOrganizationRequest');
    }
  }
}
