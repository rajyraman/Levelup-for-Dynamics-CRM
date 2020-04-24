/// <reference path="../tsd/xrm.d.ts" />

import { Utility } from './inject/levelup.common.utility';
import { IExtensionMessage } from './interfaces/types';
import { Forms } from './inject/levelup.forms';
import { Service } from './inject/levelup.servicecalls';
import { Navigation } from './inject/levelup.navigation';
import { Grid } from './inject/levelup.grid';
import { default as WebApiClient } from 'xrm-webapi-client';

window.addEventListener('message', async function (event) {
  let utility: Utility;
  let formWindow: Window;
  let formDocument: Document;
  let xrm: Xrm.XrmStatic;

  // home.dynamics.com also messaging. Ignore.
  if (location.origin !== event.origin) return;
  const source = <Window>event.source;
  if (source.Xrm && event.data.type) {
    let clientUrl =
      (source.Xrm.Page.context.getCurrentAppUrl && source.Xrm.Page.context.getCurrentAppUrl()) ||
      source.Xrm.Page.context.getClientUrl();

    // This is for differentiating between OnPrem, OnPrem on IFD or CRM Online
    let cleanedClientUrl = !clientUrl.endsWith(Xrm.Page.context.getOrgUniqueName())
      ? clientUrl
      : clientUrl.substr(0, clientUrl.lastIndexOf('/'));
    if (!cleanedClientUrl.startsWith(event.origin)) return;
    let clientUrlForParams = clientUrl;
    let contentPanels = Array.from(document.querySelectorAll('iframe')).filter(function (d) {
      return d.style.visibility !== 'hidden';
    });
    if (!clientUrl.includes('main.aspx')) {
      clientUrlForParams += '/main.aspx';
    }
    if (source.Xrm.Internal.isUci && Xrm.Internal.isUci()) {
      formWindow = window;
      formDocument = document;
      xrm = window.Xrm;
      utility = new Utility(formDocument, formWindow, xrm, clientUrl);
    } else if (contentPanels && contentPanels.length > 0) {
      formWindow = contentPanels[0].contentWindow;
      formDocument = contentPanels[0].contentDocument;
      xrm = formWindow.Xrm;
      if (!xrm) {
        formWindow = window;
        formDocument = document;
        xrm = window.Xrm;
      }
      utility = new Utility(formDocument, formWindow, xrm, clientUrl);
    }
    if (utility.is2016OrGreater) {
      await utility.retrieveEnvironmentDetails();
    }
    if ((<IExtensionMessage>event.data).category === 'Forms' && !xrm.Page.data) {
      alert('This command can only be performed in the context of a form');
      return;
    }
    try {
      let message = <IExtensionMessage>event.data;
      switch (message.category) {
        case 'Forms':
          new Forms(utility)[message.type]();
          break;
        case 'API':
          new Service(utility)[message.type]();
          break;
        case 'Grid':
          new Grid(utility)[message.type]();
          break;
        case 'Navigation':
          new Navigation(utility)[message.type]();
          break;
      }
    } catch (e) {
      console.error(e);
    }
  }
});
