/// <reference path="levelup.common.utility.ts" />

import { Utility } from './levelup.common.utility';
import { IResultRow } from '../interfaces/types';

export class Grid {
  constructor(private utility: Utility) {}

  quickFindFields() {
    let currentView = this.utility.formDocument.querySelector('span.ms-crm-View-Name'),
      resultsArray: IResultRow[] = [{ cells: ['Quick Find Attribute'] }],
      etc = this.utility.Xrm.Page.context.getQueryStringParameters().etc,
      // @ts-ignore
      entityName = this.utility.Xrm.Internal.getEntityName(parseInt(etc));
    // @ts-ignore
    if (!entityName && this.utility.Xrm.Utility.getPageContext) {
      // @ts-ignore
      let view = this.utility.Xrm.Utility.getPageContext().input;
      entityName = view.entityName;
    }
    if (entityName) {
      let attributes = 'FetchXml',
        entitySetName = this.utility.is2016OrGreater ? 'savedqueries' : 'SavedQuerySet';
      if (this.utility.is2016OrGreater) {
        attributes = attributes.toLowerCase();
      }
      let filter = this.utility.is2016OrGreater
        ? `isquickfindquery eq true and querytype eq 4 and returnedtypecode eq '${entityName}'`
        : `IsQuickFindQuery eq true and QueryType eq 4 and ReturnedTypeCode eq '${entityName}'`;
      this.utility.fetch(entitySetName, attributes, filter).then((view) => {
        let quickFindFields = [];
        if (this.utility.is2016OrGreater) {
          quickFindFields = Array.from(
            new DOMParser().parseFromString(view[0].fetchxml, 'text/html').querySelectorAll('condition')
          ).map((x) => x.getAttribute('attribute'));
        } else {
          quickFindFields = Array.from(
            new DOMParser().parseFromString(view[0].FetchXml, 'text/html').querySelectorAll('condition')
          ).map((x) => x.getAttribute('attribute'));
        }
        quickFindFields.forEach((x) => resultsArray.push({ cells: [x] }));
        this.utility.messageExtension(resultsArray, 'quickFindFields');
      });
    } else {
      alert('The current page is not a grid');
    }
  }

  openGrid() {
    let currentView = this.utility.formDocument.querySelector('span.ms-crm-View-Name'),
      etc = this.utility.Xrm.Page.context.getQueryStringParameters().etc,
      etn,
      viewId,
      viewType;
    // @ts-ignore
    if ((!currentView || !etc) && this.utility.Xrm.Utility.getPageContext) {
      // @ts-ignore
      let view = this.utility.Xrm.Utility.getPageContext().input;
      etn = view.entityName;
      viewId = view.viewId;
      viewType = view.viewType;
    }
    if (etn) {
      if (!viewId) {
        window.open(`${this.utility.clientUrlForParams}etn=${etn}&newWindow=true&pagetype=entitylist`, '_blank');
      } else {
        let viewTypeCode;
        if (viewType === 'savedquery') viewTypeCode = 1039;
        if (viewType === 'userquery') viewTypeCode = 4230;
        window.open(
          `${this.utility.clientUrlForParams}pagetype=entitylist&etn=${etn}&viewid=${viewId}&viewType=${viewTypeCode}`,
          '_blank'
        );
      }
    } else if (currentView && etc) {
      let viewType = currentView.getAttribute('currentviewtype'),
        viewId = currentView.getAttribute('currentview'),
        viewUrl = `${this.utility.clientUrlForParams}etc=${etc}&viewtype=${viewType}&viewid=${viewId}&newWindow=true&pagetype=entitylist`;
      window.open(viewUrl, '_blank');
    } else {
      alert('The current page is not a grid');
    }
  }
}
