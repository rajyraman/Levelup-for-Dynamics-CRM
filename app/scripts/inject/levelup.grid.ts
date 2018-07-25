/// <reference path="levelup.common.utility.ts" />
/// <reference path="../types.ts" />
module LevelUp {
  export class Grid {
    constructor(private utility: LevelUp.Common.Utility) {
    }

    quickFindFields() {
      let currentView = this.utility.formDocument.querySelector('span.ms-crm-View-Name'),
        resultsArray: LevelUp.Types.ResultRow[] = [{ cells: ['Quick Find Attribute'] }],
        etc = this.utility.Xrm.Page.context.getQueryStringParameters().etc,
        entityName = this.utility.Xrm.Internal.getEntityName(parseInt(etc));
      if (currentView && etc) {
        let viewType = currentView.getAttribute('currentviewtype'),
          attributes = 'FetchXml',
          entitySetName = this.utility.is2016 ? 'savedqueries' : 'SavedQuerySet';
        if (this.utility.is2016) {
          attributes = attributes.toLowerCase();
        }
        let filter = this.utility.is2016 ? `isquickfindquery eq true and querytype eq 4 and returnedtypecode eq '${entityName}'` :
          `IsQuickFindQuery eq true and QueryType eq 4 and ReturnedTypeCode eq '${entityName}'`;
        this.utility.fetch(entitySetName, attributes, filter).then((view) => {
          let quickFindFields = [];
          if (this.utility.is2016) {
            quickFindFields = Array.from(new DOMParser().parseFromString(view[0].fetchxml, "text/html").querySelectorAll('condition'))
              .map(x => x.getAttribute('attribute'));
          }
          else {
            quickFindFields = Array.from(new DOMParser().parseFromString(view[0].FetchXml, "text/html").querySelectorAll('condition'))
              .map(x => x.getAttribute('attribute'));
          }
          quickFindFields.forEach(x => resultsArray.push({ cells: [x] }));
          this.utility.messageExtension(resultsArray, 'quickFindFields');
        });
      }
      else {
        alert('The current page is not a grid');
      }
    }

    openGrid() {
      let currentView = this.utility.formDocument.querySelector('span.ms-crm-View-Name'),
        etc = this.utility.Xrm.Page.context.getQueryStringParameters().etc;
      if (currentView && etc) {
        let viewType = currentView.getAttribute('currentviewtype'),
          viewId = currentView.getAttribute('currentview'),
          viewUrl = `${this.utility.clientUrlForParams}etc=${etc}&viewtype=${viewType}&viewid=${viewId}&newWindow=true&pagetype=entitylist`;
        window.open(viewUrl, '_blank');
      }
      else {
        alert('The current page is not a grid');
      }
    }
  }
}