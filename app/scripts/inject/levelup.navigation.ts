/// <reference path="levelup.common.utility.ts" />
/// <reference path="../types.ts" />
/// <reference path="../../tsd/xrm.d.ts" />

import { Utility } from './levelup.common.utility';

export class Navigation {
  constructor(private utility: Utility) {}

  openRecord(entityName: string, entityId?: string): void {
    if (!entityName) {
      entityName = prompt('Entity?', '');
    }
    if (entityName && !entityId) {
      entityId = prompt('Id?', '');
    }
    if (entityId) {
      window.open(
        `${this.utility.clientUrlForParams}etn=${entityName}&id=${entityId}&newWindow=true&pagetype=entityrecord`,
        '_blank'
      );
    }
  }

  newRecord() {
    let entityName = prompt('Entity?', '');
    if (entityName) {
      window.open(`${this.utility.clientUrlForParams}etn=${entityName}&newWindow=true&pagetype=entityrecord`, '_blank');
    }
  }

  openSecurity() {
    window.top.document
      .getElementById('navBar')
      // @ts-ignore
      .control.raiseNavigateRequest({ uri: '/tools/AdminSecurity/adminsecurity_area.aspx?pagemode=iframe&' });
  }

  openSystemJobs() {
    this.openList('asyncoperation');
  }

  openSolutions() {
    this.openList('solution');
  }

  openProcesses() {
    this.openList('workflow');
  }

  openMain() {
    window.open(`${this.utility.clientUrl}`, '_blank');
  }

  openAdvFind() {
    if (!this.utility.Xrm.Page.data || !this.utility.Xrm.Page.data.entity) {
      window.open(`${this.utility.clientUrlForParams}pagetype=advancedfind`, '_blank');
    } else {
      let entityName = this.utility.Xrm.Page.data.entity.getEntityName();
      window.open(
        `${this.utility.clientUrlForParams}extraqs=EntityCode%3d${this.utility.Xrm.Internal.getEntityCode(
          entityName
        )}&pagetype=advancedfind`,
        '_blank'
      );
    }
  }

  mocaClient() {
    var url =
      (Xrm.Page.context.isOffice365 && Xrm.Page.context.isOffice365()) ||
      (Xrm.Page.context.isOnPremises && !Xrm.Page.context.isOnPremises())
        ? Xrm.Page.context.getClientUrl()
        : window.location.origin;
    window.open(
      `${url}/nga/main.htm?org=${this.utility.Xrm.Page.context.getOrgUniqueName()}&server=${Xrm.Page.context.getClientUrl()}`
    );
  }

  myUserRecord() {
    this.openRecord('systemuser', this.utility.Xrm.Page.context.getUserId());
  }

  myMailbox() {
    let attributes = 'MailboxId';
    let entity = 'MailboxSet';
    let filter = `RegardingObjectId/Id eq (guid'${this.utility.currentUserId}')`;
    if (this.utility.is2016OrGreater) {
      entity = 'mailboxes';
      attributes = attributes.toLocaleLowerCase();
      filter = `_regardingobjectid_value eq ${this.utility.currentUserId}`;
    }
    this.utility
      .fetch(entity, attributes, filter)
      .then((results) => {
        if (results.length > 0) {
          this.openRecord('mailbox', results[0].MailboxId || results[0].mailboxid);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }

  diagnostics() {
    if (Xrm.Internal.isUci && Xrm.Internal.isUci()) {
      window.open(`${Xrm.Page.context.getClientUrl()}/tools/diagnostics/diag.aspx/GetMetrics`);
    } else {
      window.open(`${this.utility.clientUrl}/tools/diagnostics/diag.aspx`, '_blank');
    }
  }

  perfCenter() {
    if (Xrm.Internal.isUci && Xrm.Internal.isUci() && !location.search.includes('perf=')) {
      window.location.href = `${this.utility.clientUrl}&perf=true`;
    } else {
      Mscrm.Performance.PerformanceCenter.get_instance().TogglePerformanceResultsVisibility();
    }
  }

  instancePicker() {
    if (
      (Xrm.Page.context.isOffice365 && Xrm.Page.context.isOffice365()) ||
      (Xrm.Page.context.isOnPremises && !Xrm.Page.context.isOnPremises())
    ) {
      var clientUrl = Xrm.Page.context.getClientUrl();
      window.open(
        `https://port${clientUrl.substr(clientUrl.indexOf('.'))}/G/Instances/InstancePicker.aspx?redirect=False`,
        '_blank'
      );
    } else {
      alert('Instance picker is available only for Dynamics 365/Dynamics CRM Online');
    }
  }

  openList(entityName: string) {
    if (!entityName) {
      entityName = prompt('Entity?', '');
    }
    if (entityName) {
      window.open(`${this.utility.clientUrlForParams}etn=${entityName}&pagetype=entitylist`);
    }
  }

  openMailboxes() {
    this.openList('mailbox');
  }

  openPPAC() {
    window.open('https://admin.powerplatform.microsoft.com/analytics/d365ce');
  }
}
