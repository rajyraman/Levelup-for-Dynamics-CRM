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
          serviceUrl = `/api/data/v8.0/${entity}`;
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
  
  displayLogicalNames() {
      let setLabels = (Xrm) => {
        Xrm.Page.data.entity.attributes.forEach(a => {
          a.controls.forEach(function (c) {
            var lblText = c.getLabel();
            c.setVisible(true);
            var attr = a.getName();
            var lbl = $('#' + c.getName() + '_c').html('');
            lbl.css('text-align', 'left');
            if (lbl.is('td')) {
              lbl.closest('table').children('colgroup').children('col:even').attr('width', '400');
            }
            $('<input/>').width(200).val(attr).appendTo(lbl).focus(function () {
              $(this).select();
            });
            $('<span></span>').text(lblText).appendTo(lbl);
          });
        });
      };
      
      let waitForJQ = () => {
        if (this.formWindow.jQuery) {
          $ = this.formWindow.jQuery.noConflict(true);
          setLabels(this.Xrm);
        } else {
          setTimeout(waitForJQ, 1000);
        }
      }
            
      this.Xrm.Page.ui.tabs.forEach(function (tab) {
        tab.setVisible(true);
        tab.sections.forEach(function (section) {
          section.setVisible(true);
        });
      });
      
      var $ = this.formWindow.jQuery || (this.formWindow.CEI && this.formWindow.CEI.$);
      if (!$) {
        var head = this.formWindow.document.getElementsByTagName('head').item(0);
        var s = this.formWindow.document.createElement('script');
        s.setAttribute('type', 'text/javascript');
        s.setAttribute('src', 'https://ajax.aspnetcdn.com/ajax/jquery/jquery-1.9.0.js');
        s.async = false;
        head.appendChild(s);
        waitForJQ();
      } else {
        setLabels(this.Xrm);
      }

      this.Xrm.Page.ui.tabs.forEach(t=>{
        var tabInput = parent.document.createElement('input');
        tabInput.setAttribute('style', 'width:200px');
        tabInput.value = t.getName(); 
        if(tabInput.value){
          this.formWindow.document.getElementsByName(tabInput.value)[0].prepend(tabInput);
        }
        t.sections.forEach(s=>{
          var sectionInput = parent.document.createElement('input'); 
          sectionInput.setAttribute('style', 'width:200px');
          sectionInput.value = s.getName(); 
          if(sectionInput.value){
            this.formWindow.document.getElementsByName(sectionInput.value)[0].prepend(sectionInput);
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
          this.copy(entityId);
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
    this.Xrm.Page.data.entity.attributes.forEach(a => {
      if (a.getRequiredLevel() === 'required') {
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
    let resultsArray = [{cells: ['Role Id', 'Name']}];
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
        resultsArray.push({cells: Object.keys(r).filter(x=> !x.startsWith('@') && !x.startsWith('_')).map(key=> r[key])});
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
    this.Xrm.Page.ui.controls.forEach(function (c) {
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
		});
  }

  cloneRecord() {
    let extraq = '',
    entityName = this.Xrm.Page.data.entity.getEntityName();

    this.Xrm.Page.data.entity.attributes.forEach(function (c) {
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
      attributeName.startsWith('transactioncurrency'))
        return;
      if (attributeType === 'lookup' && !c.getIsPartyList() && attributeValue.length > 0) {
        extraq += (attributeName + 'name=' + attributeValue[0].name + '&');
        if(attributeName === 'customerid' || 
            attributeName === 'parentcustomerid' ||
            c.getLookupTypes().length > 1){
          extraq += (attributeName + 'type=' + attributeValue[0].entityType + '&');
        }
        attributeValue = attributeValue[0].id;
      }
      if (attributeType === 'datetime') {
        attributeValue = attributeValue.toDateString();
      }
      extraq += (attributeName + '=' + attributeValue + '&');
    });
    var newWindowUrl = this.clientUrl + '/main.aspx?etn=' + entityName + '&pagetype=entityrecord' + '&extraqs=?' + encodeURIComponent(extraq);
    window.open(newWindowUrl);
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
        entityTypeCode = this.Xrm.Internal.getEntityCode(entityName),
        entitySetName = this.is2016 ? 'workflows' : 'WorkflowSet';        
    if(this.is2016){
      attributes = attributes.toLowerCase();
    }
    let filter = this.is2016 ? `type eq 1 and ( category eq 2 or  category eq 0) and  primaryentity eq '${entityName}'` : 
    `Type/Value eq 1 and PrimaryEntity eq '${entityTypeCode}' and (Category/Value eq 0 or Category/Value eq 2`;
    this.fetch(entitySetName, attributes, filter).then((workflows) => {
      let results = workflows
      .map(workflow => Object.keys(workflow)
      .filter(o => o.indexOf('_') == -1 && o.indexOf('@') == -1)
      .map(p => {
        let keyName = p.toLowerCase();
        let workflowKeyValue = workflow[p];
        if(keyName === 'category'){
          workflowKeyValue = workflowKeyValue === 0 ? 'Process' : 'Business Rule';
        }
        else if(keyName === 'mode'){
          workflowKeyValue = workflowKeyValue === 0 ? 'Background' : 'Real-time';
        }
        else if(keyName === 'ismanaged'){
          workflowKeyValue = workflowKeyValue ? 'Managed' : 'Unmanaged';
        }
        else if(keyName === 'statecode'){
          workflowKeyValue = workflowKeyValue === 0 ? 'Draft' : 'Activated';
        }        
        else if(keyName === 'workflowid'){
          workflowKeyValue = `${this.clientUrl}/main.aspx?etn=workflow&id=${workflowKeyValue}&newWindow=true&pagetype=entityrecord`;;
        }        
        return workflowKeyValue;
      }));
      this.messageExtension(results, 'workflows');      
    }).catch ((err) => {
      console.log(err);
    });
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
