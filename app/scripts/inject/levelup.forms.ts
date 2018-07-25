/// <reference path="../../tsd/externals.d.ts" />

module LevelUp {
  export class Forms {
    constructor(private utility: LevelUp.Common.Utility) {
    }
    clearLogicalNames() {
      this.utility.formDocument.querySelectorAll('.levelupschema').forEach(x => x.remove());
    }

    displayLogicalNames() {
      this.utility.formDocument.querySelectorAll('.levelupschema').forEach(x => x.remove());

      let createSchemaNameInput = (controlName, controlNode) => {
        let schemaNameInput = this.utility.formDocument.createElement('input');
        schemaNameInput.setAttribute('type', 'text');
        schemaNameInput.setAttribute('class', 'levelupschema');
        schemaNameInput.setAttribute('style','background: darkslategray; color: #f9fcfe; font-size: 14px;');
        schemaNameInput.value = controlName;
        if(controlNode && controlNode.parentNode) {
          controlNode.parentNode.insertBefore(schemaNameInput, controlNode);
        }
      };

      this.utility.Xrm.Page.ui.controls.forEach((c: Xrm.Page.StandardControl) => {
        let controlName = c.getName(),
          controlType = c.getControlType(),
          controlNode = this.utility.formDocument.getElementById(controlName) ||
                        this.utility.formDocument.querySelector(`label[id$="${controlName}-field-label"]`);
        if (!controlNode) {
          return;
        }
        if (!c.getAttribute) {
          createSchemaNameInput(controlName, this.utility.formDocument.getElementById(`${controlName}_d`));
        }
        else {
          if (!c.getVisible()) {
            return;
          }
          createSchemaNameInput(c.getAttribute().getName(), controlNode);
        }
      });

      this.utility.Xrm.Page.ui.tabs.forEach(t => {
        let tabName = t.getName();
        if (t.getVisible()) {
          createSchemaNameInput(tabName, 
            this.utility.formDocument.querySelector(`div[name="${tabName}"]`) || 
            this.utility.formDocument.querySelector(`li[data-id$="tablist-${tabName}"]`));
        }

        t.sections.forEach(s => {
          let sectionName = s.getName();
          if (s.getVisible()) {
            createSchemaNameInput(sectionName, 
              this.utility.formDocument.querySelector(`table[name="${sectionName}"]`) ||
              this.utility.formDocument.querySelector(`section[data-id$="${sectionName}"]`));
          }
        });
      });
    }

    godMode() {
      this.utility.Xrm.Page.data.entity.attributes.forEach(a => a.setRequiredLevel('none'));

      this.utility.Xrm.Page.ui.controls.forEach((c: Xrm.Page.StandardControl) => {
        c.setVisible(true);
        if (c.setDisabled) {
          c.setDisabled(false);
        }
        if(c.clearNotification) {
          c.clearNotification();
        }
      });

      this.utility.Xrm.Page.ui.tabs.forEach(t => {
        t.setVisible(true);
        t.setDisplayState('expanded');
        t.sections.forEach(s => s.setVisible(true));
      });
    }

    formProperties() {
      let id = this.utility.Xrm.Page.data.entity.getId();
      let etc = <number>this.utility.Xrm.Page.context.getQueryStringParameters().etc;
      Mscrm.RibbonActions.openFormProperties(id, etc);
    }

    copyRecordUrl() {
      let entityId = this.utility.Xrm.Page.data.entity.getId();
      if (entityId) {
        let locationUrl = `${this.utility.clientUrlForParams}etn=${this.utility.Xrm.Page.data.entity.getEntityName()}&id=${entityId}&newWindow=true&pagetype=entityrecord`;
        try {
          Common.Utility.copy(locationUrl);
          alert('Record URL has been copied to clipboard');
        }
        catch (e) {
          prompt('Ctrl+C to copy. OK to close.', locationUrl);
        }
      }
      else {
        alert('This record has not been saved. Please save and run this command again');
      }
    }

    copyRecordId() {
      let entityId = this.utility.Xrm.Page.data.entity.getId();
      if (entityId) {
        try {
          Common.Utility.copy(entityId.substr(1, 36));
          alert('Record Id has been copied to clipboard');
        }
        catch (e) {
          prompt('Ctrl+C to copy. OK to close.', entityId);
        }
      }
      else {
        alert('This record has not been saved. Please save and run this command again');
      }
    }

    highlightDirtyFields() {
      this.utility.Xrm.Page.ui.controls.forEach((c: Xrm.Page.StandardControl) => {
        if (c.getAttribute) {
          var dirtyAttribute = c.getAttribute();
          if (!dirtyAttribute || !dirtyAttribute.getIsDirty()) return;
          var attributeNode = this.utility.formWindow.document.getElementById(dirtyAttribute.getName()) ||
                              this.utility.formDocument.querySelector(`label[id$="${dirtyAttribute.getName()}-field-label"]`);
          if(!attributeNode) return;

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
      this.utility.Xrm.Page.data.entity.attributes.forEach(a => {
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
              let options = (<Xrm.Page.OptionSetAttribute>a).getOptions();
              a.setValue(options[0].value);
              break;
          }
        }
      });
    }

    optionSetValues() {
      this.utility.Xrm.Page.getControl().forEach((c: Xrm.Page.OptionSetControl) => {
        if (c.getControlType() !== 'optionset')
          return;
        let attribute = (<Xrm.Page.OptionSetControl>c).getAttribute(),
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
        let selectElement = this.utility.formDocument.getElementById(`${attribute.getName()}_i`);
        if (selectElement) {
          selectElement.parentElement.removeAttribute('style');
          selectElement.parentElement.removeAttribute('class');
        }
      });
    }

    cloneRecord() {
      let extraq = '',
        entityName = this.utility.Xrm.Page.data.entity.getEntityName(),
        fieldCount = 0,
        isFieldCountLimitExceeded = false;
      this.utility.Xrm.Page.data.entity.attributes.forEach((c: Xrm.Page.Attribute) => {
        if (fieldCount > 45) {
          isFieldCountLimitExceeded = true;
          return;
        }
        let attributeType = c.getAttributeType(),
          attributeName = c.getName(),
          attributeValue = c.getValue();

        if (!attributeValue ||
          attributeName === 'createdon' ||
          attributeName === 'modifiedon' ||
          attributeName === 'createdby' ||
          attributeName === 'modifiedby' ||
          attributeName === 'processid' ||
          attributeName === 'stageid' ||
          attributeName === 'ownerid' ||
          attributeName.startsWith('transactioncurrency'))
          return;
        if (attributeType === 'lookup' && !(<Xrm.Page.LookupAttribute>c).getIsPartyList() && attributeValue.length > 0) {
          let lookupValue = <Xrm.Page.LookupAttribute>c;
          extraq += (attributeName + 'name=' + attributeValue[0].name + '&');
          fieldCount++;
          if (attributeName === 'customerid' ||
            attributeName === 'parentcustomerid' ||
            (typeof lookupValue.getLookupTypes === 'function' 
            && Array.isArray(lookupValue.getLookupTypes()) 
            && lookupValue.getLookupTypes().length > 1)) {
            extraq += (attributeName + 'type=' + attributeValue[0].entityType + '&');
            fieldCount++;
          }
          attributeValue = attributeValue[0].id;
        }
        if (attributeType === 'datetime') {
          attributeValue = (<Date>attributeValue).toDateString();
        }
        extraq += (attributeName + '=' + attributeValue + '&');
        fieldCount++;
      });
      if (isFieldCountLimitExceeded) {
        alert('This form contains more than 45 fields and cannot be cloned');
      }
      else {
        var newWindowUrl = this.utility.clientUrlForParams + 'etn=' + entityName + '&pagetype=entityrecord' + '&extraqs=?' + encodeURIComponent(extraq);
        window.open(newWindowUrl);
      }
    }

    refresh() {
      this.utility.Xrm.Page.data.refresh(false).then(() => {
        this.utility.Xrm.Page.data.entity.addOnSave((econtext) => {
          var eventArgs = econtext.getEventArgs();
          if (eventArgs.getSaveMode() === 70 || eventArgs.getSaveMode() === 2) {
            eventArgs.preventDefault();
          }
        });
        alert('Form refreshed without save. Autosave turned off.');
      }, (error: Xrm.Async.OfflineErrorCallbackObject): void => {
        alert(error.message);
      });
    }

    workflows() {
      let attributes = 'WorkflowId,Name,Category,Mode,IsManaged,StateCode',
        entityName = this.utility.Xrm.Page.data.entity.getEntityName(),
        entitySetName = this.utility.is2016 ? 'workflows' : 'WorkflowSet';
      if (this.utility.is2016) {
        attributes = attributes.toLowerCase();
      }
      let filter = this.utility.is2016 ? `type eq 1 and ( category eq 2 or  category eq 0) and  primaryentity eq '${entityName}'` :
        `Type/Value eq 1 and PrimaryEntity eq '${entityName}' and (Category/Value eq 0 or Category/Value eq 2)`;
      this.utility.fetch(entitySetName, attributes, filter).then((workflows) => {
        //CRM2015 Data doesn't return attributes in order specified on select
        let results = workflows.map(workflow => {
          let resultRow: Types.ResultRowKeyValues[] = [
            { key: 'workflowid', value: '' },
            { key: 'name', value: '' },
            { key: 'category', value: '' },
            { key: 'mode', value: '' },
            { key: 'ismanaged', value: '' },
            { key: 'statecode', value: '' }
          ];
          Object.keys(workflow)
            .filter(o => o.indexOf('_') == -1 && o.indexOf('@') == -1)
            .forEach(p => {
              let keyName = p.toLowerCase(),
                workflowKeyValue = workflow[p];
              if (keyName === 'category') {
                workflowKeyValue = (workflowKeyValue === 0 || workflowKeyValue.Value === 0) ? 'Process' : 'Business Rule';
              }
              else if (keyName === 'mode') {
                workflowKeyValue = (workflowKeyValue === 0 || workflowKeyValue.Value === 0) ? 'Background' : 'Real-time';
              }
              else if (keyName === 'ismanaged') {
                workflowKeyValue = (workflowKeyValue || workflowKeyValue.Value) ? 'Managed' : 'Unmanaged';
              }
              else if (keyName === 'statecode') {
                workflowKeyValue = (workflowKeyValue === 0 || workflowKeyValue.Value === 0) ? 'Draft' : 'Activated';
              }
              else if (keyName === 'workflowid') {
                workflowKeyValue = `${this.utility.clientUrlForParams}etn=workflow&id=${workflowKeyValue}&newWindow=true&pagetype=entityrecord`;;
              }
              resultRow.find(k => k.key === keyName).value = workflowKeyValue;
            });
          return resultRow;
        });
        this.utility.messageExtension(results, 'workflows');
      }).catch((err) => {
        console.log(err);
      });
    }

    copyLookup() {
      let currentControl = this.utility.Xrm.Page.ui.getCurrentControl();
      if (currentControl && currentControl.getControlType() === 'lookup') {
        let currentLookup = currentControl.getAttribute().getValue();
        if (currentLookup) {
          let serialisedLookupValue = JSON.stringify(
            currentLookup.map((x: Xrm.Page.LookupValue) => {
              let c: Xrm.Page.LookupValue;
              ({
                id: c.id,
                name: c.name,
                type: c.type,
                typename: c.typename,
                entityType: c.entityType
              } = x);
              return c;
            }));
          sessionStorage.setItem('ryr_serialisedLookup', serialisedLookupValue);
          alert('Lookup copied. Ready to paste');
        }
      } else {
        alert('No field has been selected or the currently selected field is not a lookup');
      }
    }

    pasteLookup() {
      let currentControl = this.utility.Xrm.Page.ui.getCurrentControl();
      if (currentControl && currentControl.getControlType() === 'lookup') {
        let currentLookup = currentControl.getAttribute();
        let copiedLookupValue = sessionStorage.getItem('ryr_serialisedLookup');
        if (copiedLookupValue) {
          currentLookup.setValue(JSON.parse(copiedLookupValue));
        } else {
          alert('Please select a lookup to copy first before pasting');
        }
      } else {
        alert('No field has been selected or the currently selected field is not a lookup');
      }
    }

    openLookupNewWindow() {
      var currentControl = this.utility.Xrm.Page.ui.getCurrentControl();
      if (currentControl.getControlType() === 'lookup') {
        var currentLookup = currentControl.getAttribute().getValue();
        if (currentLookup) {
          var entityName = currentLookup[0].type,
            entityId = currentLookup[0].id;
          var url = `${this.utility.clientUrlForParams}etc=${entityName}&id=${entityId}&newWindow=true&pagetype=entityrecord`;
          window.open(url, '_blank');
        }
      } else {
        alert('The currently selected control is not a lookup');
      }
    }

    customize() {
      let etc = <number>this.utility.Xrm.Page.context.getQueryStringParameters().etc;
      if (etc && Mscrm.RibbonActions.openEntityEditor && typeof Mscrm.RibbonActions.openEntityEditor === 'function') {
        Mscrm.RibbonActions.openEntityEditor(etc);
      }
    }

    allFields() {
      CrmSdk.Async.retrieve(
        this.utility.Xrm.Page.data.entity.getEntityName(),
        this.utility.Xrm.Page.data.entity.getId().substr(1, 36),
        new CrmSdk.ColumnSet(true),
        entity => {
          let attributes = entity.getAttributes()
            , formattedAttributes = entity.getFormattedValues()
            , attributeNames = attributes.getNames()
            , formAttributes = this.utility.Xrm.Page.getAttribute().map(x => x.getName())
            , attributesNotInForm = attributeNames.filter(x => formAttributes.indexOf(x) > -1 || !this.utility.Xrm.Page.getControl(x) || !this.utility.Xrm.Page.getControl(x).getVisible()),
            resultsArray = [{ cells: ['Attribute Name', 'Value'] }];

          let attributeValues = attributesNotInForm.forEach(x => {
            let attribute = attributes.getAttributeByName(x),
              attributeValue = attribute.getValue();
            if (formattedAttributes.containsName(x)) {
              let formattedValue = formattedAttributes.getItem(x).getValue();
              if (formattedValue) {
                resultsArray.push({ cells: [x, formattedAttributes.getItem(x).getValue()] });
              }
            }
            else {
              resultsArray.push({ cells: [x, attribute.getType() !== 'entityReference' ? attributeValue : attributeValue.getName() || attributeValue.getId()] });
            }
          });
          this.utility.messageExtension(resultsArray, 'allFields');
        },
        error => console.log(error));
    }

    toggleTabs() {
      this.utility.Xrm.Page.ui.tabs.forEach(t => {
        var currentState = t.getDisplayState();
        t.setDisplayState(currentState === 'expanded' ? 'collapsed' : 'expanded');
      });
    }
  }
}