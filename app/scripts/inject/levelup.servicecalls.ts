import { Utility } from './levelup.common.utility';
import * as WebApiClient from 'xrm-webapi-client';
import { IImpersonateMessage, IImpersonationResponse, UserDetail } from '../interfaces/types';

// @ts-ignore
WebApiClient.Configure({
  ReturnAllPages: true,
});

export class Service {
  constructor(private utility: Utility) {}

  environmentDetails() {
    if (!this.utility.is2016OrGreater) {
      alert('This functionality is not available on this version of CRM');
      return;
    }
    const resultsArray = [{ cells: ['Name', 'Value'] }];
    const keys = Object.keys(this.utility.environmentDetail);
    keys.forEach((k) => {
      if (k !== 'Endpoints') {
        resultsArray.push({ cells: [k, this.utility.environmentDetail[k]] });
      }
    });
    console.log(this.utility.environmentDetail);
    this.utility.messageExtension(resultsArray, 'environment');
  }

  environmentSettings() {
    const entity = this.utility.is2016OrGreater ? 'organizations' : 'OrganizationSet';
    this.utility
      .fetch(entity)
      .then((c) => {
        let settings = {};
        const settingsArray = [];
        if (c.length > 0) {
          settings = c[0];
        }
        for (const s in settings) {
          if (s.indexOf('@') === -1 && s.indexOf('_') === -1) {
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
    const resultsArray = [{ cells: ['Name', 'Role Id'] }];
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
    const resultsArray: any[] = [{ cells: ['Business Unit', 'User', 'AD Name', 'Roles'] }];
    const request = {
      entityName: 'systemuser',
      queryParams:
        '?$select=systemuserid,domainname,_businessunitid_value,fullname&$expand=systemuserroles_association($select=roleid,name;$filter=(_parentroleid_value eq null))&$filter=(islicensed eq true)',
      headers: [
        { key: 'Prefer', value: 'odata.include-annotations="*"' },
        { key: 'OData-MaxVersion', value: '4.0' },
        { key: 'OData-Version', value: '4.0' },
      ],
    };
    const utility = this.utility;

    WebApiClient.Retrieve(request)
      .then(function (response) {
        //@ts-ignore
        return WebApiClient.Expand({
          records: response.value,
        });
      })
      .then((entities) => {
        console.log(entities);
        entities.forEach((attributes) => {
          const userId = attributes['systemuserid'],
            userName = attributes['fullname'];

          resultsArray.push({
            bu: attributes['_businessunitid_value@OData.Community.Display.V1.FormattedValue'],
            user: {
              id: userId,
              name: userName,
              url: `${utility.clientUrlForParams}etn=systemuser&id=${userId}&newWindow=true&pagetype=entityrecord`,
            },
            adname: attributes['domainname'],
            roles: attributes.systemuserroles_association.value.map((x) => x.name),
          });
        });
        utility.messageExtension(resultsArray, 'allUserRoles');
      })
      .catch((err) => console.log(err));
  }

  entityMetadata() {
    this.utility
      .fetch(`EntityDefinitions`, 'LogicalName,ObjectTypeCode,LogicalCollectionName,ChangeTrackingEnabled,DisplayName')
      .then((records) => {
        const resultsArray = [
          {
            cells: [
              'Entity Logical Name',
              'Object Type Code',
              'Logical Collection Name',
              'Change Tracking Enabled',
              'Display Name',
            ],
          },
        ];
        // sort by object type code
        records.sort(function (r1, r2) {
          if (r1.LogicalName > r2.LogicalName) return 1;
          else if (r1.LogicalName < r2.LogicalName) return -1;
          return 0;
        });
        records.forEach(function (r) {
          resultsArray.push({
            cells: [
              r.LogicalName,
              r.ObjectTypeCode,
              r.LogicalCollectionName,
              r.ChangeTrackingEnabled,
              r.DisplayName?.UserLocalizedLabel?.Label,
            ],
          });
        });
        this.utility.messageExtension(resultsArray, 'entityMetadata');
      });
  }
  async impersonateUser(impersonateRequest: IImpersonateMessage) {
    if (typeof Xrm.Utility.getGlobalContext === 'function') {
      const privs: {
        [key: string]: {
          id: string;
          businessUnitId: string;
          privilegeName: string;
          depth: number;
        };
        //@ts-ignore
      } = await Xrm.Utility.getGlobalContext().userSettings.getSecurityRolePrivilegesInfo();
      const canImpersonate = Object.keys(privs)
        .map((k) => privs[k])
        .some((x) => x.privilegeName === 'prvActOnBehalfOfAnotherUser');
      if (!canImpersonate) {
        impersonateRequest.canImpersonate = false;
        this.utility.messageExtension(
          <IImpersonationResponse>{ users: [], impersonateRequest: impersonateRequest },
          'Impersonation'
        );
        return null;
      }
    }
    const domainNameCondition = impersonateRequest.url
      ? `<condition attribute='domainname' operator='eq' value='${impersonateRequest.userName}' />`
      : `<condition attribute='domainname' operator='like' value='%${impersonateRequest.userName}%' />`;
    const fullNameCondition = impersonateRequest.url
      ? `<condition attribute='fullname' operator='eq' value='${impersonateRequest.userName}' />`
      : `<condition attribute='fullname' operator='like' value='%${impersonateRequest.userName}%' />`;
    const request = {
      entityName: 'systemuser',
      fetchXml: `<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true' >
        <entity name='systemuser' >
          <attribute name='systemuserid' />
          <attribute name='fullname' />
          <attribute name='domainname' />
          <attribute name='azureactivedirectoryobjectid' />
          <filter>
            <condition attribute='isdisabled' operator='eq' value='0' />
            condition attribute='islicensed' operator='eq' value='1' />
            <condition attribute='accessmode' operator='eq' value='0' />
            <filter type="or">
              ${domainNameCondition}
              ${fullNameCondition}
            </filter>
          </filter>
          <order attribute='fullname' descending='false' />
        </entity>
      </fetch>`,
    };

    const users = await WebApiClient.Retrieve(request);
    const resultsArray = (<[]>users.value).map<UserDetail>(
      (x) =>
        <UserDetail>{ fullName: x['fullname'], userId: x['azureactivedirectoryobjectid'], userName: x['domainname'] }
    );
    impersonateRequest.canImpersonate = true;
    this.utility.messageExtension(
      <IImpersonationResponse>{ users: resultsArray, impersonateRequest: impersonateRequest },
      'Impersonation'
    );
    return resultsArray;
  }
}
