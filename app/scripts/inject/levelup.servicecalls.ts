/// <reference path="levelup.common.utility.ts" />
/// <reference path="../types.ts" />

module LevelUp {
    export class Service {
        constructor(private utility: LevelUp.Common.Utility) {
        }

        environmentDetails() {
            let entity = this.utility.is2016 ? 'organizations' : 'OrganizationSet';
            this.utility.fetch(entity).then((c) => {
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
            }).catch((err) => {
                console.log(err);
            });
        }

        myRoles() {
            let resultsArray = [{ cells: ['Name', 'Role Id'] }];
            let attributes = 'RoleId,Name';
            let entity = 'RoleSet';
            let filter = Xrm.Page.context.getUserRoles().map(x => `RoleId eq (guid'${x}')`).join(' or ');
            if (this.utility.is2016) {
                entity = 'roles';
                attributes = attributes.toLocaleLowerCase();
                filter = Xrm.Page.context.getUserRoles().map(x => `roleid eq ${x}`).join(' or ');
            }
            this.utility.fetch(entity, attributes, filter)
                .then((results) => {
                    results.forEach(r => {
                        resultsArray.push({ cells: Object.keys(r).sort().filter(x => !x.startsWith('@') && !x.startsWith('_')).map(key => r[key]) });
                    });
                    this.utility.messageExtension(resultsArray, 'myRoles');
                }).catch((err) => {
                    console.log(err);
                });
        }

        allUserRoles() {
            let resultsArray: any[] = [{ cells: ['Role', 'User'] }];
            CrmSdk.Async.retrieveMultiple(new CrmSdk.Query.FetchExpression('<fetch><entity name="systemuser" ><attribute name="fullname" /><link-entity name="systemuserroles" from="systemuserid" to="systemuserid" alias="systemuserroles"><attribute name="roleid" /><attribute name="systemuserid" /><link-entity name="role" from="roleid" to="roleid" alias="role"><attribute name="name" /><order attribute="name" /><filter><condition attribute="parentroleid" operator="null" /></filter></link-entity></link-entity></entity></fetch>'), results => {
                let entities = results.getEntities().toArray();
                let cells = entities.forEach(x => {
                    let attributes = x.getAttributes(),
                        roleId = attributes.getAttributeByName('systemuserroles.roleid').getValue(),
                        roleName = attributes.getAttributeByName('role.name').getValue(),
                        userId = attributes.getAttributeByName('systemuserroles.systemuserid').getValue(),
                        userName = attributes.getAttributeByName('fullname').getValue();

                    resultsArray.push({
                        role: {
                            id: roleId,
                            name: roleName,
                            url: `${this.utility.clientUrl}/main.aspx?etn=role&id=${roleId}&newWindow=true&pagetype=entityrecord`
                        },
                        user: {
                            id: userId,
                            name: userName,
                            url: `${this.utility.clientUrl}/main.aspx?etn=systemuser&id=${userId}&newWindow=true&pagetype=entityrecord`
                        }
                    });
                });
                this.utility.messageExtension(resultsArray, 'allUserRoles');
            });
        }
    }
} 
