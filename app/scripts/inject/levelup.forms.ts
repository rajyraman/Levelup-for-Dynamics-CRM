import { Utility } from './levelup.common.utility';
import { IResultRowKeyValues } from '../interfaces/types';
export class Forms {
  constructor(private utility: Utility) {}

  clearLogicalNames() {
    this.utility.formDocument.querySelectorAll('.levelupschema').forEach((x) => x.remove());
  }

  entityMetadata() {
    this.utility.fetch(`EntityDefinitions`, 'LogicalName,ObjectTypeCode').then((records) => {
      const resultsArray = [{ cells: ['Entity Logical Name', 'Object Type Code'] }];
      // sort by object type code
      records.sort(function (r1, r2) {
        return r1.ObjectTypeCode - r2.ObjectTypeCode;
      });
      records.forEach(function (r) {
        resultsArray.push({ cells: [r.LogicalName, r.ObjectTypeCode] });
      });
      this.utility.messageExtension(resultsArray, 'entityMetadata');
    });
  }

  displayLogicalNames() {
    this.utility.formDocument.querySelectorAll('.levelupschema').forEach((x) => x.remove());

    const createSchemaNameInput = (controlName, controlNode) => {
      const schemaNameInput = this.utility.formDocument.createElement('input');
      schemaNameInput.setAttribute('type', 'text');
      schemaNameInput.setAttribute('class', 'levelupschema');
      schemaNameInput.setAttribute('style', 'background: darkslategray; color: #f9fcfe; font-size: 14px;');
      schemaNameInput.value = controlName;
      if (controlNode && controlNode.parentNode) {
        controlNode.parentNode.insertBefore(schemaNameInput, controlNode);
      }
    };

    this.utility.Xrm.Page.ui.controls.forEach((c: Xrm.Page.StandardControl) => {
      const controlName = c.getName();
      if (!c.getAttribute) {
        createSchemaNameInput(controlName, this.utility.formDocument.getElementById(`${controlName}_d`));
      } else {
        const attributeName = c.getAttribute().getName(),
          controlNode =
            this.utility.formDocument.getElementById(controlName) ||
            this.utility.formDocument
              .querySelector(`div[data-control-name="${controlName}"]`)
              .querySelector(`label[id$="${attributeName}-field-label"]`) ||
            this.utility.formDocument.querySelector(`label[id$="${controlName}-field-label"]`);
        if (!controlNode) {
          return;
        }
        if (!c.getVisible()) {
          return;
        }
        createSchemaNameInput(attributeName, controlNode);
      }
    });

    this.utility.Xrm.Page.ui.tabs.forEach((t) => {
      const tabName = t.getName();
      if (t.getVisible()) {
        createSchemaNameInput(
          tabName,
          this.utility.formDocument.querySelector(`div[name="${tabName}"]`) ||
            this.utility.formDocument.querySelector(`li[data-id$="tablist-${tabName}"]`)
        );
      }

      t.sections.forEach((s) => {
        const sectionName = s.getName();
        if (s.getVisible()) {
          createSchemaNameInput(
            sectionName,
            this.utility.formDocument.querySelector(`table[name="${sectionName}"]`) ||
              this.utility.formDocument.querySelector(`section[data-id$="${sectionName}"]`)
          );
        }
      });
    });
  }

  godMode() {
    const selectedTab = this.utility.Xrm.Page.ui.tabs.get((x) => x.getDisplayState() === 'expanded')[0];

    this.utility.Xrm.Page.data.entity.attributes.forEach((a) => a.setRequiredLevel('none'));

    this.utility.Xrm.Page.ui.controls.forEach((c: Xrm.Page.StandardControl) => {
      c.setVisible(true);
      if (c.setDisabled) {
        c.setDisabled(false);
      }
      if (c.clearNotification) {
        c.clearNotification();
      }
    });

    this.utility.Xrm.Page.ui.tabs.forEach((t) => {
      t.setVisible(true);
      t.setDisplayState('expanded');
      t.sections.forEach((s) => s.setVisible(true));
    });

    if (selectedTab.setFocus) {
      selectedTab.setDisplayState('expanded');
      selectedTab.setFocus();
    }
  }

  formProperties() {
    const id = this.utility.Xrm.Page.data.entity.getId();
    const etc = <number>this.utility.Xrm.Page.context.getQueryStringParameters().etc;
    //@ts-ignore
    Mscrm.RibbonActions.openFormProperties(id, etc);
  }

  copyRecordUrl() {
    const entityId = this.utility.Xrm.Page.data.entity.getId();
    if (entityId) {
      const locationUrl = `${
        this.utility.clientUrlForParams
      }etn=${this.utility.Xrm.Page.data.entity.getEntityName()}&id=${entityId}&newWindow=true&pagetype=entityrecord`;
      try {
        Utility.copy(locationUrl);
        alert('Record URL has been copied to clipboard');
      } catch (e) {
        prompt('Ctrl+C to copy. OK to close.', locationUrl);
      }
    } else {
      alert('This record has not been saved. Please save and run this command again');
    }
  }

  copyRecordId() {
    const entityId = this.utility.Xrm.Page.data.entity.getId().toLowerCase();
    if (entityId) {
      try {
        Utility.copy(entityId.substr(1, 36));
        alert('Record Id has been copied to clipboard');
      } catch (e) {
        prompt('Ctrl+C to copy. OK to close.', entityId);
      }
    } else {
      alert('This record has not been saved. Please save and run this command again');
    }
  }

  openRecordWebApi() {
    if (!this.utility.is2016OrGreater) {
      alert('This feature only works on CRM instances > v8');
      return;
    }
    const entityId = this.utility.Xrm.Page.data.entity.getId();
    if (entityId) {
      const entityName = this.utility.Xrm.Page.data.entity.getEntityName();
      this.utility.fetch(`EntityDefinitions(LogicalName='${entityName}')`, 'EntitySetName').then((entity) => {
        if (entity && entity.EntitySetName) {
          const url = `${this.utility.Xrm.Page.context.getClientUrl()}/api/data/v${Xrm.Page.context
            .getVersion()
            .substr(0, 3)}/${entity.EntitySetName}(${entityId.substr(1, 36)})`;
          window.open(url, '_blank');
        }
      });
    }
  }

  highlightDirtyFields() {
    this.utility.Xrm.Page.ui.controls.forEach((c: Xrm.Page.StandardControl) => {
      if (c.getAttribute) {
        const dirtyAttribute = c.getAttribute();
        if (!dirtyAttribute || !dirtyAttribute.getIsDirty()) return;
        const attributeNode =
          this.utility.formWindow.document.getElementById(dirtyAttribute.getName()) ||
          this.utility.formDocument.querySelector(
            `div[data-id="${dirtyAttribute.getName()}-FieldSectionItemContainer"]`
          ) ||
          this.utility.formDocument.querySelector(`label[id$="${dirtyAttribute.getName()}-field-label"]`);
        if (!attributeNode) return;

        attributeNode.setAttribute('style', 'border: 1px solid red');
      }
    });
  }

  refreshAllSubgrids() {
    this.utility.Xrm.Page.ui.controls.forEach(function (c: Xrm.Page.GridControl) {
      if (c.getControlType() === 'subgrid') {
        c.refresh();
      }
    });
  }

  populateMin() {
    if (this.utility.Xrm.Page.ui.getFormType() !== 1) {
      alert('This action cannot be run against an existing record.');
      return;
    }
    this.utility.Xrm.Page.data.entity.attributes.forEach((a) => {
      if (a.getRequiredLevel() === 'required' && !a.getValue()) {
        switch (a.getAttributeType()) {
          case 'memo':
            a.setValue('memo');
            break;
          case 'string':
            a.setValue('string');
            break;
          case 'boolean':
            a.setValue(false);
            break;
          case 'datetime':
            a.setValue(new Date());
            break;
          case 'decimal':
          case 'double':
          case 'integer':
          case 'money':
            a.setValue((<Xrm.Page.NumberAttribute>a).getMin());
            break;
          case 'optionset':
            const options = (<Xrm.Page.OptionSetAttribute>a).getOptions();
            a.setValue(options[0].value);
            break;
        }
      }
    });
  }

  optionSetValues() {
    this.utility.Xrm.Page.getControl().forEach((c: Xrm.Page.OptionSetControl) => {
      if (c.getControlType() !== 'optionset') return;
      const attribute = (<Xrm.Page.OptionSetControl>c).getAttribute(),
        selectedOptionValue = attribute.getValue(),
        options = attribute.getOptions(),
        isClearOptions = options.some(function (o) {
          return o.text.indexOf(' (') === -1;
        });
      if (isClearOptions) {
        c.clearOptions();
      }
      options.forEach(function (o) {
        if (o.text && o.text.indexOf(' (') === -1) {
          o.text = o.text + ' (' + o.value + ')';
        }
        c.addOption(o);
      });
      if (selectedOptionValue && isClearOptions) {
        attribute.setValue(selectedOptionValue);
      }
      const selectElement = this.utility.formDocument.getElementById(`${attribute.getName()}_i`);
      if (selectElement) {
        selectElement.parentElement.removeAttribute('style');
        selectElement.parentElement.removeAttribute('class');
      }
    });
  }

  cloneRecord() {
    let extraq = '',
      fieldCount = 0,
      isFieldCountLimitExceeded = false;
    const entityName = this.utility.Xrm.Page.data.entity.getEntityName();
    this.utility.Xrm.Page.data.entity.attributes.forEach((c: Xrm.Page.Attribute) => {
      if (fieldCount > 45) {
        isFieldCountLimitExceeded = true;
        return;
      }
      const attributeType = c.getAttributeType(),
        attributeName = c.getName();
      let attributeValue = c.getValue();

      if (
        !attributeValue ||
        attributeName === 'createdon' ||
        attributeName === 'modifiedon' ||
        attributeName === 'createdby' ||
        attributeName === 'modifiedby' ||
        attributeName === 'processid' ||
        attributeName === 'stageid' ||
        attributeName === 'ownerid' ||
        attributeName.startsWith('transactioncurrency')
      )
        return;
      if (
        attributeType === 'lookup' &&
        !(<Xrm.Attributes.LookupAttribute>c).getIsPartyList() &&
        attributeValue.length > 0
      ) {
        const lookupValue = <Xrm.Page.LookupAttribute>c;
        extraq += attributeName + 'name=' + attributeValue[0].name + '&';
        fieldCount++;
        if (
          attributeName === 'customerid' ||
          attributeName === 'parentcustomerid' ||
          (typeof lookupValue['getLookupTypes'] === 'function' &&
            //@ts-ignore
            Array.isArray(lookupValue.getLookupTypes()) &&
            //@ts-ignore
            lookupValue.getLookupTypes().length > 1)
        ) {
          extraq += attributeName + 'type=' + attributeValue[0].entityType + '&';
          fieldCount++;
        }
        attributeValue = attributeValue[0].id;
      }
      if (attributeType === 'datetime') {
        attributeValue = (<Date>attributeValue).toDateString();
      }
      extraq += attributeName + '=' + attributeValue + '&';
      fieldCount++;
    });
    if (isFieldCountLimitExceeded) {
      alert('This form contains more than 45 fields and cannot be cloned');
    } else {
      const newWindowUrl =
        this.utility.clientUrlForParams +
        'etn=' +
        entityName +
        '&pagetype=entityrecord' +
        '&extraqs=?' +
        encodeURIComponent(extraq);
      window.open(newWindowUrl);
    }
  }

  refresh() {
    this.utility.Xrm.Page.data.refresh(false).then(
      () => {
        this.utility.Xrm.Page.data.entity.addOnSave((econtext: Xrm.Events.SaveEventContext) => {
          const eventArgs = econtext.getEventArgs();
          if (eventArgs.getSaveMode() === 70 || eventArgs.getSaveMode() === 2) {
            eventArgs.preventDefault();
          }
        });
        alert('Form refreshed without save. Autosave turned off.');
      },
      (error: Xrm.Async.OfflineErrorCallbackObject): void => {
        alert(error.message);
      }
    );
  }

  workflows() {
    let attributes =
      'WorkflowId,Name,Category,Mode,RunAs,IsManaged,SubProcess,OnDemand,TriggerOnCreate,TriggerOnDelete,TriggerOnUpdateAttributeList,StateCode';
    const entityName = this.utility.Xrm.Page.data.entity.getEntityName(),
      entitySetName = this.utility.is2016OrGreater ? 'workflows' : 'WorkflowSet';
    if (this.utility.is2016OrGreater) {
      attributes = attributes.toLowerCase();
    }
    const filter = this.utility.is2016OrGreater
      ? `type eq 1 and (category eq 0 or category eq 2 or category eq 2 or category eq 3) and  primaryentity eq '${entityName}'`
      : `Type/Value eq 1 and PrimaryEntity eq '${entityName}' and (Category/Value eq 0 or Category/Value eq 2 or Category/Value eq 3)`;
    this.utility
      .fetch(entitySetName, attributes, filter)
      .then((workflows) => {
        // CRM2015 Data doesn't return attributes in order specified on select
        let results = workflows.map((workflow) => {
          const resultRow: IResultRowKeyValues[] = [
            { key: 'workflowid', value: '' },
            { key: 'name', value: '' },
            { key: 'category', value: '' },
            { key: 'mode', value: '' },
            { key: 'runas', value: '' },
            { key: 'ismanaged', value: '' },
            { key: 'subprocess', value: '' },
            { key: 'ondemand', value: '' },
            { key: 'triggeroncreate', value: '' },
            { key: 'triggerondelete', value: '' },
            { key: 'triggeronupdateattributelist', value: '' },
            { key: 'statecode', value: '' },
          ];
          Object.keys(workflow)
            .filter((o) => o.indexOf('_') === -1 && o.indexOf('@') === -1)
            .forEach((p) => {
              const keyName = p.toLowerCase();
              let workflowKeyValue = workflow[p];
              if (keyName === 'category') {
                workflowKeyValue =
                  workflowKeyValue === 0 || workflowKeyValue.Value === 0
                    ? 'Process'
                    : workflowKeyValue === 2 || workflowKeyValue.Value === 2
                    ? 'Business Rule'
                    : 'Action';
              } else if (keyName === 'mode') {
                workflowKeyValue = workflowKeyValue === 0 || workflowKeyValue.Value === 0 ? 'Background' : 'Real-time';
              } else if (keyName === 'runas') {
                workflowKeyValue =
                  workflowKeyValue === 0 || workflowKeyValue.Value === 0
                    ? 'Owner'
                    : workflowKeyValue === 1 || workflowKeyValue.Value === 1
                    ? 'User'
                    : '';
              } else if (keyName === 'ismanaged') {
                workflowKeyValue = workflowKeyValue || workflowKeyValue.Value ? 'Managed' : 'Unmanaged';
              } else if (
                keyName === 'subprocess' ||
                keyName === 'ondemand' ||
                keyName === 'triggeroncreate' ||
                keyName === 'triggerondelete'
              ) {
                workflowKeyValue = workflowKeyValue || workflowKeyValue.Value ? '&#10004;' : '';
              } else if (keyName === 'triggeronupdateattributelist') {
                workflowKeyValue = workflowKeyValue ? workflowKeyValue.replace(/,/g, '<br>') : '';
              } else if (keyName === 'statecode') {
                workflowKeyValue = workflowKeyValue === 0 || workflowKeyValue.Value === 0 ? 'Draft' : 'Activated';
              } else if (keyName === 'workflowid') {
                workflowKeyValue = `${this.utility.clientUrl.substr(
                  0,
                  this.utility.clientUrl.lastIndexOf('/')
                )}/sfa/workflow/edit.aspx?id=${workflowKeyValue}&newWindow=true`;
              }
              resultRow.find((k) => k.key === keyName).value = workflowKeyValue;
            });
          return resultRow;
        });
        // Sort results by category, then by name
        results = results
          ? results.sort((a, b) =>
              a[2].value < b[2].value ? 1 : a[2].value === b[2].value ? (a[1].value > b[1].value ? 1 : -1) : -1
            )
          : results;
        this.utility.messageExtension(results, 'workflows');
      })
      .catch((err) => {
        console.log(err);
      });
  }

  openLookupNewWindow() {
    //@ts-ignore
    const currentControl = this.utility.Xrm.Page.ui.getCurrentControl();
    if (currentControl.getControlType() === 'lookup') {
      const currentLookup = currentControl.getAttribute().getValue();
      if (currentLookup) {
        const entityName = currentLookup[0].type,
          entityId = currentLookup[0].id;
        const url = `${this.utility.clientUrlForParams}etc=${entityName}&id=${entityId}&newWindow=true&pagetype=entityrecord`;
        window.open(url, '_blank');
      }
    } else {
      alert('The currently selected control is not a lookup');
    }
  }

  allFields() {
    const entityId = this.utility.Xrm.Page.data.entity.getId();
    if (entityId) {
      const entityName = this.utility.Xrm.Page.data.entity.getEntityName();
      const resultsArray = [{ cells: ['Attribute Name', 'Value'] }];
      this.utility.fetch(`EntityDefinitions(LogicalName='${entityName}')`, 'EntitySetName').then((entity) => {
        if (entity && entity.EntitySetName) {
          this.utility.fetch(entity.EntitySetName, null, null, entityId.substr(1, 36).toLowerCase()).then((r) => {
            const keys = Object.keys(r);
            keys.forEach((k) => {
              resultsArray.push({ cells: [k, r[k]] });
            });
            console.log(r);
            this.utility.messageExtension(resultsArray, 'allFields');
          });
        }
      });
    }
  }

  toggleTabs() {
    this.utility.Xrm.Page.ui.tabs.forEach((t) => {
      const currentState = t.getDisplayState();
      t.setDisplayState(currentState === 'expanded' ? 'collapsed' : 'expanded');
    });
  }

  optionSets() {
    const optionSets = this.utility.Xrm.Page.getControl()
      .filter((x) => x.getControlType() === 'boolean' || x.getControlType() === 'optionset')
      //@ts-ignore
      .map((x) => ({ name: x.getName(), options: (<Xrm.Page.OptionSetAttribute>x.getAttribute()).getOptions() }));
    this.utility.messageExtension(optionSets, 'optionsets');
  }

  blurFields() {
    setFilter(this.utility.Xrm.Page.getAttribute(), this.utility.formDocument, 'blur(5px)');
  }

  resetBlur() {
    setFilter(this.utility.Xrm.Page.getAttribute(), this.utility.formDocument, '');
  }
}

function setFilter(attributes, formDocument, filter) {
  attributes.forEach((x) => {
    const e = <HTMLDivElement>(
      document.querySelector(`div[data-id="${x.getName()}-FieldSectionItemContainer"] div[data-lp-id]`)
    );
    if (e) {
      e.style.filter = filter;
    }
  });
  formDocument.querySelector(`h1[data-id='header_title']`).style.filter = filter;
  formDocument
    .querySelectorAll(
      '.wj-row[aria-label="Data"], #headerControlsList > div[role="presentation"] > div:first-child, div[data-lp-id$="MscrmControls.FieldControls.TextBoxControl"], div[data-lp-id^="MscrmControls.Containers.QuickForm"] div[data-lp-id^="MscrmControls.FieldControls.TextBoxControl"]'
    )
    .forEach((e) => (e.style.filter = filter));
}
