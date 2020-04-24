/// <reference path="levelup.common.utility.ts" />

import { Utility } from './levelup.common.utility';

export class Service {
  constructor(private utility: Utility) {}

  environmentDetails() {
    if (!this.utility.is2016OrGreater) {
      alert('This functionality is not available on this version of CRM');
      return;
    }
    const resultsArray = [{ cells: ['Name', 'Value'] }];
    let keys = Object.keys(this.utility.environmentDetail);
    keys.forEach((k) => {
      if (k !== 'Endpoints') {
        resultsArray.push({ cells: [k, this.utility.environmentDetail[k]] });
      }
    });
    console.log(this.utility.environmentDetail);
    this.utility.messageExtension(resultsArray, 'environment');
  }

  environmentSettings() {
    let entity = this.utility.is2016OrGreater ? 'organizations' : 'OrganizationSet';
    this.utility
      .fetch(entity)
      .then((c) => {
        let settings = {};
        let settingsArray = [];
        if (c.length > 0) {
          settings = c[0];
        }
        for (let s in settings) {
          if (s.indexOf('@') == -1 && s.indexOf('_') == -1) {
            settingsArray.push({ name: s, value: settings[s] });
          }
        }
        this.utility.messageExtension(settingsArray, 'Settings');
      })
      .catch((err) => {
        console.log(err);
      });
  }

  myRoles() {
    let resultsArray = [{ cells: ['Name', 'Role Id'] }];
    let attributes = 'RoleId,Name';
    let entity = 'RoleSet';
    let filter = Xrm.Page.context
      .getUserRoles()
      .map((x) => `RoleId eq (guid'${x}')`)
      .join(' or ');
    if (this.utility.is2016OrGreater) {
      entity = 'roles';
      attributes = attributes.toLocaleLowerCase();
      filter = Xrm.Page.context
        .getUserRoles()
        .map((x) => `roleid eq ${x}`)
        .join(' or ');
    }
    this.utility
      .fetch(entity, attributes, filter)
      .then((results) => {
        results.forEach((r) => {
          resultsArray.push({
            cells: Object.keys(r)
              .sort()
              .filter((x) => !x.startsWith('@') && !x.startsWith('_'))
              .map((key) => r[key]),
          });
        });
        this.utility.messageExtension(resultsArray, 'myRoles');
      })
      .catch((err) => {
        console.log(err);
      });
  }

  allUserRoles() {
    let resultsArray: any[] = [{ cells: ['Business Unit', 'Role', 'User', 'AD Name'] }];
    this.utility
      .fetch(
        'systemusers',
        null,
        null,
        null,
        `
            <fetch>
                <entity name="systemuser" >
                    <attribute name="domainname" />
                    <attribute name="businessunitid" />
                    <attribute name="fullname" />
                    <filter>
                        <condition entityname="role" attribute="parentroleid" operator="null" />
                    </filter>
                    <link-entity name="systemuserroles" from="systemuserid" to="systemuserid" link-type="outer" alias="systemuserroles" >
                        <attribute name="roleid" />
                        <attribute name="systemuserid" />
                        <link-entity name="role" from="roleid" to="roleid" link-type="outer" alias="role" >
                            <attribute name="name" />
                            <order attribute="name" />
                        </link-entity>
                    </link-entity>
                </entity>
            </fetch>`
      )
      .then((entities) => {
        console.log(entities);
        let cells = entities.forEach((attributes) => {
          let roleId = attributes['systemuserroles.roleid'] || 'No Role',
            roleName = attributes['role.name'] || 'No Role',
            userId = attributes['systemuserid'],
            userName = attributes['fullname'];

          resultsArray.push({
            bu: attributes['_businessunitid_value@OData.Community.Display.V1.FormattedValue'],
            role: {
              id: roleId,
              name: roleName,
              url: `${this.utility.clientUrlForParams}etn=role&id=${roleId}&newWindow=true&pagetype=entityrecord`,
            },
            user: {
              id: userId,
              name: userName,
              url: `${this.utility.clientUrlForParams}etn=systemuser&id=${userId}&newWindow=true&pagetype=entityrecord`,
            },
            adname: attributes['domainname'],
          });
        });
        this.utility.messageExtension(resultsArray, 'allUserRoles');
      });
  }
}
