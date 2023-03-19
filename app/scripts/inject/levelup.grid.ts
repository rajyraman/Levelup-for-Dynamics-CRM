import { Utility } from './levelup.common.utility';
import { IResultRow } from '../interfaces/types';

export class Grid {
  constructor(private utility: Utility) {}

  quickFindFields() {
    const resultsArray: IResultRow[] = [{ cells: ['Quick Find Attribute'] }],
      etc = this.utility.Xrm.Page.context.getQueryStringParameters().etc;
    //@ts-ignore
    let entityName = this.utility.Xrm.Internal.getEntityName(parseInt(etc));
    if (!entityName && this.utility.Xrm.Utility.getPageContext) {
      const view = this.utility.Xrm.Utility.getPageContext().input;
      entityName = view.entityName;
    }
    if (entityName) {
      let attributes = 'FetchXml';
      const entitySetName = this.utility.is2016OrGreater ? 'savedqueries' : 'SavedQuerySet';
      if (this.utility.is2016OrGreater) {
        attributes = attributes.toLowerCase();
      }
      const filter = this.utility.is2016OrGreater
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
      alert('The current page is not a view');
    }
  }

  sendToFXB() {
    //@ts-ignore
    if (this.utility.Xrm.Utility.getPageContext) {
      const view = <Xrm.EntityListPageContext>this.utility.Xrm.Utility.getPageContext().input;

      this.utility.fetch('savedqueries', 'fetchxml', `savedqueryid eq ${view.viewId}`).then((view) => {
        if (view && view[0].fetchxml) {
          window.open(
            `xrmtoolbox:///plugin%3A"FetchXML Builder" /data%3A"${view[0].fetchxml.replaceAll('"', "'")}"`,
            '_blank'
          );
        }
      });
    } else {
      alert('The current page is not a view');
    }
  }

  openGrid() {
    const currentView = this.utility.formDocument.querySelector('span.ms-crm-View-Name'),
      etc = this.utility.Xrm.Page.context.getQueryStringParameters().etc;
    let etn, viewId, viewType;
    if ((!currentView || !etc) && this.utility.Xrm.Utility.getPageContext) {
      const view = this.utility.Xrm.Utility.getPageContext().input;
      etn = view.entityName;
      //@ts-ignore
      viewId = view.viewId;
      //@ts-ignore
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
      const viewType = currentView.getAttribute('currentviewtype'),
        viewId = currentView.getAttribute('currentview'),
        viewUrl = `${this.utility.clientUrlForParams}etc=${etc}&viewtype=${viewType}&viewid=${viewId}&newWindow=true&pagetype=entitylist`;
      window.open(viewUrl, '_blank');
    } else {
      alert('The current page is not a view');
    }
  }

  blurView() {
    setFilter(this.utility.formDocument, 'blur(5px)');
  }

  resetViewBlur() {
    setFilter(this.utility.formDocument, '');
  }
}

function setFilter(formDocument: Document, filter: string) {
  formDocument.querySelectorAll('div[role="gridcell"]').forEach((e: HTMLElement) => (e.style.filter = filter));
}
