/// <reference path="levelup.common.utility.ts" />
/// <reference path="../types.ts" />
module LevelUp {
  export class Navigation {
    constructor(private utility: LevelUp.Common.Utility) {
    }

    openRecord(entityName: string, entityId: string): void {
      if (!entityName) {
        entityName = prompt("Entity?", "");
      }
      if (entityName && !entityId) {
        entityId = prompt("Id?", "");
      }
      if (entityId) {
        window.open(`${this.utility.clientUrl}/main.aspx?etn=${entityName}&id=${entityId}&newWindow=true&pagetype=entityrecord`, '_blank');
      }
    }

    newRecord() {
      let entityName = prompt("Entity?", "");
      if (entityName) {
        window.open(`${this.utility.clientUrl}/main.aspx?etn=${entityName}&newWindow=true&pagetype=entityrecord`, '_blank');
      }
    }

    openSecurity() {
      window.top.document.getElementById('navBar').control.raiseNavigateRequest({ uri: '/tools/AdminSecurity/adminsecurity_area.aspx?pagemode=iframe&' });
    }

    openSystemJobs() {
      window.top.document.getElementById('navBar').control.raiseNavigateRequest({ uri: '/tools/business/home_asyncoperation.aspx?pagemode=iframe&' });
    }

    openSolutions() {
      window.open(`${this.utility.clientUrl}/main.aspx?Origin=Portal&page=Settings&area=nav_solution`);
    }

    openProcesses() {
      window.top.document.getElementById('navBar').control.raiseNavigateRequest({ uri: '/_root/homepage.aspx?etc=4703&pagemode=iframe&sitemappath=Settings|ProcessCenter|nav_workflow' });
    }

    openMain() {
      window.open(`${this.utility.clientUrl}/main.aspx`, '_blank');
    }

    openAdvFind() {
      if (!this.utility.Xrm.Page.data || !this.utility.Xrm.Page.data.entity) {
        window.open(`${this.utility.clientUrl}/main.aspx?pagetype=advancedfind`, '_blank');
      }
      else {
        let entityName = this.utility.Xrm.Page.data.entity.getEntityName();
        window.open(`${this.utility.clientUrl}/main.aspx?extraqs=EntityCode%3d${this.utility.Xrm.Internal.getEntityCode(entityName)}&pagetype=advancedfind`, '_blank');
      }
    }

    mocaClient() {
      var url = Xrm.Page.context.isOffice365() ? this.utility.clientUrl : window.location.origin;
      window.open(`${url}/nga/main.htm?org=${this.utility.Xrm.Page.context.getOrgUniqueName()}&server=${this.utility.clientUrl}`);
    }

    myUserRecord() {
      this.openRecord('systemuser', this.utility.Xrm.Page.context.getUserId());
    }

    myMailbox() {
      let attributes = 'MailboxId';
      let entity = 'MailboxSet';
      let filter = `RegardingObjectId/Id eq (guid'${this.utility.currentUserId}')`;
      if (this.utility.is2016) {
        entity = 'mailboxes';
        attributes = attributes.toLocaleLowerCase();
        filter = `_regardingobjectid_value eq ${this.utility.currentUserId}`;
      }
      this.utility.fetch(entity, attributes, filter)
        .then((results) => {
          if (results.length > 0) {
            this.openRecord('mailbox', results[0].MailboxId || results[0].mailboxid);
          }
        }).catch((err) => {
          console.log(err);
        });
    }

    diagnostics() {
      window.open(`${this.utility.clientUrl}/tools/diagnostics/diag.aspx`, '_blank');
    }

    perfCenter() {
      Mscrm.Performance.PerformanceCenter.get_instance().TogglePerformanceResultsVisibility();
    }

    instancePicker() {
      if (this.utility.Xrm.Page.context.isOffice365()) {
        window.open(`https://port${this.utility.clientUrl.substr(this.utility.clientUrl.indexOf('.'))}/G/Instances/InstancePicker.aspx?redirect=False`, '_blank');
      }
      else {
        alert('Instance picker is available only for Dynamics 365/Dynamics CRM Online');
      }
    }

    openList(entityName: string) {
      if (!entityName) {
        entityName = prompt("Entity?", "");
      }
      if (entityName) {
        window.open(`${this.utility.clientUrl}/main.aspx?etn=${entityName}&pagetype=entitylist`);
      }
    }

    openMailboxes() {
      this.openList("mailbox");
    }
  }
}