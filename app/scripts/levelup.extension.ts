/// <reference path="../tsd/xrm.d.ts" />

import { Utility } from './inject/levelup.common.utility';
import { ExtensionMessage } from './types';
import { Forms } from './inject/levelup.forms';
import { Service } from './inject/levelup.servicecalls';
import { Navigation } from './inject/levelup.navigation';
import { Grid } from './inject/levelup.grid';

window.addEventListener('message', function (event) {
  let utility: Utility;
  let formWindow: Window;
  let formDocument: Document;
  let xrm: Xrm.XrmStatic;

  // home.dynamics.com also messaging. Ignore.
  if (location.origin !== event.origin) return;
  debugger;
  // @ts-ignore
  if (event.source.Xrm && event.data.type) {
    let clientUrl =
      // @ts-ignore
      (event.source.Xrm.Page.context.getCurrentAppUrl &&
        // @ts-ignore
        event.source.Xrm.Page.context.getCurrentAppUrl()) ||
      // @ts-ignore
      event.source.Xrm.Page.context.getClientUrl();
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
    // @ts-ignore
    if (event.source.Xrm.Internal.isUci && Xrm.Internal.isUci()) {
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

    if ((<ExtensionMessage>event.data).category === 'Forms' && !xrm.Page.data) {
      alert('This command can only be performed in the context of a form');
      return;
    }
    try {
      let message = <ExtensionMessage>event.data;
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
