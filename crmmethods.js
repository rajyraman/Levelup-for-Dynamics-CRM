class LevelUp {

  copy(valueToCopy){
    var t = document.createElement('input');
    t.setAttribute('id', 'copy');
    t.setAttribute('value', valueToCopy);
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    t.remove();
  }

  fetch(entity, attributes, filter) {
      let headers = new Headers({
        "Accept" : "application/json",
        "Content-Type" : "application/json; charset=utf-8",
      });
      let serviceUrl = `${this.clientUrl}/XRMServices/2011/OrganizationData.svc/${entity}`;
      if(this.is2016) {
          headers = new Headers({
            "Accept" : "application/json",
            "Content-Type" : "application/json; charset=utf-8",
            "OData-MaxVersion" : "4.0",
            "OData-Version" : "4.0"
          });
          serviceUrl = `${this.clientUrl}/api/data/v8.0/${entity}`;
      }
      if(attributes){
        serviceUrl += `?$select=${attributes}`;
      }      
      if(filter) {
        serviceUrl += `&$filter=${filter}`;
      }
      return fetch(serviceUrl, {
        method : 'GET',
        headers : headers,
        credentials : 'include'
      }).then((response) => {
        return response.json();
      }).then((c) => {
        if(c.d){
          return c.d.results;
        }
        else if (c.value) {
          return c.value;
        }
      }).catch ((err) => {
        console.log(err);
      });    
  }

  messageExtension(message, category) {
       let levelUpEvent = new CustomEvent('levelup', { 'detail': { type: 'page', category: category, content: message} });
       levelUpEvent.initEvent('levelup', false, false);
       document.dispatchEvent(levelUpEvent);
  }
    
  openRecord(entityName, entityId) {
    if(!entityName) {
      entityName = prompt("Entity?", "");
    }
    if(entityName && !entityId) {
      entityId = prompt("Id?", "");
    }
    if(entityId) {
      window.open(`${this.clientUrl}/main.aspx?etn=${entityName}&id=${entityId}&newWindow=true&pagetype=entityrecord`, '_blank');
    }
  }

  newRecord(){
    let entityName = prompt("Entity?", "");
    if(entityName){
      window.open(`${this.clientUrl}/main.aspx?etn=${entityName}&newWindow=true&pagetype=entityrecord`, '_blank');
    }
  }

  displayLogicalNames() {
      this.formDocument.querySelectorAll('.levelupschema').forEach(x => x.remove());

      let createSchemaNameInput = (controlName, controlNode) => {
          let schemaNameInput = this.formDocument.createElement('input');
          schemaNameInput.setAttribute('type','text');
          schemaNameInput.setAttribute('class','levelupschema');
          schemaNameInput.value = controlName;
          controlNode.parentNode.insertBefore(schemaNameInput, controlNode);
      };

      this.Xrm.Page.ui.controls.forEach(c => {
        let controlName = c.getName(),
          controlType = c.getControlType(),
          controlNode = this.formDocument.getElementById(controlName);
        if(!controlNode){
          return;
        }
        let parentNodeId = controlNode.getAttribute('aria-describedby');
        if(!c.getAttribute) {
          createSchemaNameInput(controlName, this.formDocument.getElementById(`${controlName}_d`));
        }
        else {
          if(!c.getVisible()) {
            return;
          }
          let parentNode = this.formDocument.getElementById(parentNodeId);
          if(parentNode) {
            createSchemaNameInput(controlName, parentNode);
            parentNode.style.overflow = 'hidden';
          }
        }
      });

      this.Xrm.Page.ui.tabs.forEach(t => {
        let tabName = t.getName();
        if(t.getVisible()){
          createSchemaNameInput(tabName, this.formDocument.querySelector(`div[name="${tabName}"]`));
        }
        
        t.sections.forEach(s => {
          let sectionName = s.getName();
          if(s.getVisible()) {
            createSchemaNameInput(sectionName, this.formDocument.querySelector(`table[name="${sectionName}"]`));
          }
        });
      });      
  }
  
  godMode() {
      this.Xrm.Page.data.entity.attributes.forEach(a => a.setRequiredLevel('none'));
      
      this.Xrm.Page.ui.controls.forEach(c => {
          c.setVisible(true);
          if(c.setDisabled){
            c.setDisabled(false);
          }
          c.clearNotification();
      });
      
      this.Xrm.Page.ui.tabs.forEach(t => {
        t.setVisible(true);
        t.setDisplayState('expanded');
        t.sections.forEach(s => s.setVisible(true));
      });
  }
  
  formProperties() {
    var id = this.Xrm.Page.data.entity.getId();
    var etc = this.Xrm.Page.context.getQueryStringParameters().etc;
    window.Mscrm.RibbonActions.openFormProperties(id, etc);
  }
  
  copyRecordUrl() {
      let entityId = this.Xrm.Page.data.entity.getId();
      if (entityId) {
        let locationUrl = `${this.clientUrl}/main.aspx?etn=${this.Xrm.Page.data.entity.getEntityName()}&id=${entityId}&newWindow=true&pagetype=entityrecord`;
        try{
          this.copy(locationUrl);
          alert('Record URL has been copied to clipboard');
        }
        catch(e){
          prompt('Ctrl+C to copy. OK to close.', locationUrl);
        }
      }
      else {
        alert('This record has not been saved. Please save and run this command again');
      }
  }
  
  copyRecordId() {
      let entityId = this.Xrm.Page.data.entity.getId();
      if (entityId) {
        try{
          this.copy(entityId.substr(1,36));
          alert('Record Id has been copied to clipboard');
        }
        catch(e){
          prompt('Ctrl+C to copy. OK to close.', entityId);
        }        
      }
      else{
        alert('This record has not been saved. Please save and run this command again');
      }
  }
  
  openSecurity() {
    window.top.document.getElementById('navBar').control.raiseNavigateRequest({uri: '/tools/AdminSecurity/adminsecurity_area.aspx?pagemode=iframe&'});
  }
  
  openSystemJobs() {
    window.top.document.getElementById('navBar').control.raiseNavigateRequest({uri: '/tools/business/home_asyncoperation.aspx?pagemode=iframe&'});
  }
  
  openSolutions() {
    window.open(`${this.clientUrl}/main.aspx?Origin=Portal&page=Settings&area=nav_solution`);
  }
  
  openProcesses() {
    window.top.document.getElementById('navBar').control.raiseNavigateRequest({uri: '/_root/homepage.aspx?etc=4703&pagemode=iframe&sitemappath=Settings|ProcessCenter|nav_workflow'});
  }
  
  highlightDirtyFields() {
      this.Xrm.Page.ui.controls.forEach(c => {
        if (c.getAttribute) {
          var dirtyAttribute = c.getAttribute();
          if(!dirtyAttribute || !dirtyAttribute.getIsDirty()) return;
          this.formWindow.document.getElementById(dirtyAttribute.getName()).setAttribute('style', 'border: 1px solid red');
        }
      });
  }
  
  openMain() {
    window.open(`${this.clientUrl}/main.aspx`,'_blank');
  }
  
  openAdvFind() {
    if(!this.Xrm.Page.data || !this.Xrm.Page.data.entity) {
      window.open(`${this.clientUrl}/main.aspx?pagetype=advancedfind`,'_blank');
    }
    else {
        let entityName = this.Xrm.Page.data.entity.getEntityName();
        window.open(`${this.clientUrl}/main.aspx?extraqs=EntityCode%3d${this.Xrm.Internal.getEntityCode(entityName)}&pagetype=advancedfind`,'_blank');
    }
  }
  
  mocaClient() {
      var url = Xrm.Page.context.isOffice365() ? this.clientUrl : window.location.origin;
      window.open(`${url}/nga/main.htm?org=${this.Xrm.Page.context.getOrgUniqueName()}&server=${this.clientUrl}`);
  }
  
  refreshAllSubgrids() {
    this.Xrm.Page.ui.controls.forEach(function (c) {
			if (c.getControlType() === 'subgrid') {
				c.refresh();
			}
		});
  }
  
  populateMin(){
    if(this.Xrm.Page.ui.getFormType() !== 1){
      alert('This action cannot be run against an existing record.');
      return;
    }
    this.Xrm.Page.data.entity.attributes.forEach(a => {
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
              a.setValue(a.getMin());
              break;
            case 'optionset':
              let options = a.getOptions();
              a.setValue(options[0].value);
              break;
        }
      }
    });
  }
  
  environmentDetails() {
    let entity = this.is2016 ? 'organizations' : 'OrganizationSet';
    this.fetch(entity).then((c) => {
      let settings = {};
      let settingsArray = [];
      if(c.length > 0){
        settings = c[0];
      }
      for(let s in settings) {
        if(s.indexOf('@') == -1 && s.indexOf('_') == -1){
          settingsArray.push({name: s, value: settings[s]});
        }
      }
      this.messageExtension(settingsArray, 'settings');      
    }).catch ((err) => {
      console.log(err);
    });
  }

  myUserRecord(){
    this.openRecord('systemuser', this.Xrm.Page.context.getUserId());
  }

  myRoles(){
    let resultsArray = [{cells: ['Name','Role Id']}];
    let attributes = 'RoleId,Name';
    let entity = 'RoleSet';
    let filter = Xrm.Page.context.getUserRoles().map(x=>`RoleId eq (guid'${x}')`).join(' or ');
    if(this.is2016) {
      entity = 'roles';
      attributes = attributes.toLocaleLowerCase();
      filter = Xrm.Page.context.getUserRoles().map(x=>`roleid eq ${x}`).join(' or ');
    }
    this.fetch(entity, attributes, filter)
    .then((results) => {
      results.forEach(r=>{
        resultsArray.push({cells: Object.keys(r).sort().filter(x=> !x.startsWith('@') && !x.startsWith('_')).map(key=> r[key])});
      });
      this.messageExtension(resultsArray, 'userroles');            
    }).catch ((err) => {
      console.log(err);
    });
  }

  myMailbox(){
    let attributes = 'MailboxId';
    let entity = 'MailboxSet';
    let filter = `RegardingObjectId/Id eq (guid'${this.currentUserId}')`;
    if(this.is2016) {
      entity = 'mailboxes';
      attributes = attributes.toLocaleLowerCase();
      filter = `_regardingobjectid_value eq ${this.currentUserId}`;
    }
    this.fetch(entity, attributes, filter)
    .then((results) => {
      if(results.length > 0){
        this.openRecord('mailbox', results[0].MailboxId || results[0].mailboxid);
      }
    }).catch ((err) => {
      console.log(err);
    });
  }

  optionSetValues() {
    this.Xrm.Page.getControl().forEach(c => {
			if (c.getControlType() !== 'optionset')
				return;
			let attribute = c.getAttribute(),
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
      let selectElement = this.formDocument.getElementById(`${attribute.getName()}_i`);
			if (selectElement) {
				selectElement.parentElement.removeAttribute('style');
				selectElement.parentElement.removeAttribute('class');
			}
		});
  }

  cloneRecord() {
    let extraq = '',
        entityName = this.Xrm.Page.data.entity.getEntityName(),
        fieldCount = 0,
        isFieldCountLimitExceeded = false;
    this.Xrm.Page.data.entity.attributes.forEach(function (c) {
      if(fieldCount > 45){
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
      if (attributeType === 'lookup' && !c.getIsPartyList() && attributeValue.length > 0) {
        extraq += (attributeName + 'name=' + attributeValue[0].name + '&');
        fieldCount++;
        if(attributeName === 'customerid' || 
            attributeName === 'parentcustomerid' ||
            (typeof c.getLookupTypes === 'function' && c.getLookupTypes().length > 1)){
          extraq += (attributeName + 'type=' + attributeValue[0].entityType + '&');
          fieldCount++;
        }
        attributeValue = attributeValue[0].id;
      }
      if (attributeType === 'datetime') {
        attributeValue = attributeValue.toDateString();
      }
      extraq += (attributeName + '=' + attributeValue + '&');
      fieldCount++;
    });
    if(isFieldCountLimitExceeded){
      alert('This form contains more than 45 fields and cannot be cloned');
    }
    else{
      var newWindowUrl = this.clientUrl + '/main.aspx?etn=' + entityName + '&pagetype=entityrecord' + '&extraqs=?' + encodeURIComponent(extraq);
      window.open(newWindowUrl);
    }
  }

  refresh(){
    this.Xrm.Page.data.refresh(false).then(() => {
			this.Xrm.Page.data.entity.addOnSave((econtext) => {
				var eventArgs = econtext.getEventArgs();
				if (eventArgs.getSaveMode() === 70 || eventArgs.getSaveMode() === 2) {
					eventArgs.preventDefault();
				}
			});
			alert('Form refreshed without save. Autosave turned off.');
		}, function (errorCode, message) {
			alert(message);
		});
  }

  diagnostics() {
    window.open(`${this.clientUrl}/tools/diagnostics/diag.aspx`,'_blank');
  }
  
  perfCenter() {
    Mscrm.Performance.PerformanceCenter.get_instance().TogglePerformanceResultsVisibility();
  }

  toggleTabs() {
    this.Xrm.Page.ui.tabs.forEach(t => {
      var currentState = t.getDisplayState();
      t.setDisplayState(currentState === 'expanded' ? 'collapsed' : 'expanded');
    });
  }

  instancePicker() {
    if(this.Xrm.Page.context.isOffice365()) {
      window.open(`https://port${this.clientUrl.substr(this.clientUrl.indexOf('.'))}/G/Instances/InstancePicker.aspx?redirect=False`,'_blank');
    }
    else{
      alert('Instance picker is available only for Dynamics 365/Dynamics CRM Online');
    }
  }

  workflows() {
    let attributes = 'WorkflowId,Name,Category,Mode,IsManaged,StateCode',
        entityName = this.Xrm.Page.data.entity.getEntityName(),
        entitySetName = this.is2016 ? 'workflows' : 'WorkflowSet';        
    if(this.is2016){
      attributes = attributes.toLowerCase();
    }
    let filter = this.is2016 ? `type eq 1 and ( category eq 2 or  category eq 0) and  primaryentity eq '${entityName}'` : 
    `Type/Value eq 1 and PrimaryEntity eq '${entityName}' and (Category/Value eq 0 or Category/Value eq 2)`;
    this.fetch(entitySetName, attributes, filter).then((workflows) => {
      //CRM2015 Data doesn't return attributes in order specified on select
      let results = workflows.map(workflow => {
      let resultRow = [
          {key: 'workflowid', value: ''}, 
          {key: 'name', value: ''}, 
          {key: 'category', value: ''}, 
          {key: 'mode', value: ''}, 
          {key: 'ismanaged', value: ''}, 
          {key: 'statecode', value: ''}
        ];
        Object.keys(workflow)
        .filter(o => o.indexOf('_') == -1 && o.indexOf('@') == -1)
        .forEach(p => {
          let keyName = p.toLowerCase(),
          workflowKeyValue = workflow[p];
          if(keyName === 'category'){
            workflowKeyValue = (workflowKeyValue === 0 || workflowKeyValue.Value === 0)? 'Process' : 'Business Rule';
          }
          else if(keyName === 'mode'){
            workflowKeyValue = (workflowKeyValue === 0 || workflowKeyValue.Value === 0) ? 'Background' : 'Real-time';
          }
          else if(keyName === 'ismanaged'){
            workflowKeyValue = (workflowKeyValue || workflowKeyValue.Value) ? 'Managed' : 'Unmanaged';
          }
          else if(keyName === 'statecode'){
            workflowKeyValue = (workflowKeyValue === 0 || workflowKeyValue.Value === 0)? 'Draft' : 'Activated';
          }        
          else if(keyName === 'workflowid'){
            workflowKeyValue = `${this.clientUrl}/main.aspx?etn=workflow&id=${workflowKeyValue}&newWindow=true&pagetype=entityrecord`;;
          }
          resultRow.find(k=>k.key === keyName).value = workflowKeyValue;
        });
        return resultRow;
      });
      this.messageExtension(results, 'workflows');      
    }).catch ((err) => {
      console.log(err);
    });
  }

  copyLookup() {
      let currentControl = this.Xrm.Page.ui.getCurrentControl();
      if (currentControl && currentControl.getControlType() === 'lookup') {
        let currentLookup = currentControl.getAttribute().getValue();
        if (currentLookup) {
          let serialisedLookupValue = JSON.stringify(
            currentLookup.map(x => {
              let c = {};
              ({
                id : c.id,
                name : c.name,
                type : c.type,
                typename : c.typename,
                entityType : c.entityType
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
      let currentControl = this.Xrm.Page.ui.getCurrentControl();
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
      var currentControl = this.Xrm.Page.ui.getCurrentControl();
      if (currentControl.getControlType() === 'lookup') {
        var currentLookup = currentControl.getAttribute().getValue();
        if (currentLookup) {
          var entityName = currentLookup[0].type,
          entityId = currentLookup[0].id;
          var url = `${this.clientUrl}/main.aspx?etc=${entityName}&id=${entityId}&newWindow=true&pagetype=entityrecord`;
          window.open(url, '_blank');
        }
      } else {
        alert('The currently selected control is not a lookup');
      }
  }

  openGrid(){
    let currentView = this.formDocument.querySelector('span.ms-crm-View-Name'),
        etc = this.Xrm.Page.context.getQueryStringParameters().etc;
    if(currentView && etc){
      let viewType = currentView.getAttribute('currentviewtype'),
          viewId = currentView.getAttribute('currentview'),
          viewUrl = `${this.clientUrl}/main.aspx?etc=${etc}&viewtype=${viewType}&viewid=${viewId}&newWindow=true&pagetype=entitylist`;
      window.open(viewUrl, '_blank');
    }
    else {
      alert('The current page is not a grid');
    }
  }

  customize(){
    let etc = this.Xrm.Page.context.getQueryStringParameters().etc;
    if(etc && Mscrm.RibbonActions.openEntityEditor && typeof Mscrm.RibbonActions.openEntityEditor === 'function'){
      Mscrm.RibbonActions.openEntityEditor(etc);
    }
  }

  allFields(){
    Sdk.Async.retrieve(
      this.Xrm.Page.data.entity.getEntityName(),
      this.Xrm.Page.data.entity.getId().substr(1,36),
      new Sdk.ColumnSet(true),
      entity => { 
        console.log(entity);
        let attributes = entity.getAttributes()
          ,formattedAttributes = entity.getFormattedValues()
          ,attributeNames = attributes.getNames()
          ,formAttributes = this.Xrm.Page.getAttribute().map(x=>x.getName())
          ,attributesNotInForm = attributeNames.filter(x=>!formAttributes.includes(x) || !this.Xrm.Page.getControl(x) || !this.Xrm.Page.getControl(x).getVisible()),
          resultsArray = [{cells: ['Attribute Name', 'Value']}];

        let attributeValues = attributesNotInForm.forEach(x=>{
          let attribute = attributes.getAttributeByName(x),
              attributeValue = attribute.getValue();
          if(formattedAttributes.containsName(x)){
            let formattedValue = formattedAttributes.getItem(x).getValue();
            if(formattedValue) {
              resultsArray.push({cells: [x, formattedAttributes.getItem(x).getValue()]});
            }
          }
          else{
            resultsArray.push({cells: [x, attribute.getType() !== 'entityReference' ? attributeValue : attributeValue.getName() || attributeValue.getId()]});
          }
        });
        this.messageExtension(resultsArray, 'allfields');                    
    },error=>console.log(error));
  }

  quickFindFields(){
    let currentView = this.formDocument.querySelector('span.ms-crm-View-Name'),
        resultsArray = [{cells: ['Quick Find Attribute']}],
        etc = this.Xrm.Page.context.getQueryStringParameters().etc,
        entityName = this.Xrm.Internal.getEntityName(parseInt(etc));
    if(currentView && etc){
      let viewType = currentView.getAttribute('currentviewtype'),
          attributes = 'FetchXml',
          entitySetName = this.is2016 ? 'savedqueries' : 'SavedQuerySet';        
      if(this.is2016){
        attributes = attributes.toLowerCase();
      }
      let filter = this.is2016 ? `isquickfindquery eq true and querytype eq 4 and returnedtypecode eq '${entityName}'` : 
      `IsQuickFindQuery eq true and QueryType eq 4 and ReturnedTypeCode eq '${entityName}'`;
      this.fetch(entitySetName, attributes, filter).then((view) => {
        let quickFindFields = [];
        if(this.is2016) {
          quickFindFields = Array.from(new DOMParser().parseFromString(view[0].fetchxml, "text/html").querySelectorAll('condition'))
                                .map(x=>x.getAttribute('attribute'));
        }
        else {
          quickFindFields = Array.from(new DOMParser().parseFromString(view[0].FetchXml, "text/html").querySelectorAll('condition'))
                                .map(x=>x.getAttribute('attribute'));
        }
        quickFindFields.forEach(x=>resultsArray.push({cells:[x]}));
        this.messageExtension(resultsArray, 'quickFindFields');
      });
    }
    else {
      alert('The current page is not a grid');
    }
  } 
}

var RYR = new LevelUp();
window.addEventListener('message', function(event) {
  //home.dynamics.com also messaging. Ignore.
  if(location.origin !== event.origin) return;
  
  if(event.source.Xrm && event.data.type){
    RYR.clientUrl = event.source.Xrm.Page.context.getClientUrl();
    //This is for differentiating between OnPrem, OnPrem on IFD or CRM Online
    RYR.cleanedClientUrl = !RYR.clientUrl.endsWith(Xrm.Page.context.getOrgUniqueName()) ? 
                          RYR.clientUrl : RYR.clientUrl.substr(0, RYR.clientUrl.lastIndexOf('/'));  
    if(event.origin !== RYR.cleanedClientUrl) return;
    let version = event.source.Xrm.Page.context.getVersion ? event.source.Xrm.Page.context.getVersion() : APPLICATION_VERSION;
    RYR.is2016 = version.startsWith('8');
    RYR.currentUserId = event.source.Xrm.Page.context.getUserId().substr(1,36);
    let contentPanels = Array.from(document.querySelectorAll('iframe')).filter(function (d) {
        return d.style.visibility !== 'hidden'
      });
      
    if (contentPanels && contentPanels.length > 0) {
      RYR.formWindow = contentPanels[0].contentWindow;
      RYR.formDocument = contentPanels[0].contentDocument;
      RYR.Xrm = RYR.formWindow.Xrm;
    }

    if(event.data.category === 'forms' && !RYR.Xrm.Page.data) {
        alert('This command can only be performed in the context of a form');
        return;
    }
    try{
      RYR[event.data.type]();
    }catch(e){
      console.error(e);
    }
  }
});
