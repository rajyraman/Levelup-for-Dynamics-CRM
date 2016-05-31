class LevelUp {
  
  messageExtension(message) {
       let levelUpEvent = new CustomEvent('levelup', { 'detail': { type: 'page', category: 'settings', content: message} });
       levelUpEvent.initEvent('levelup');
       document.dispatchEvent(levelUpEvent);
  }
    
  openRecord() {
    var entityName = prompt("Entity?", ""), entityId = prompt("Id?", "");
    window.open(`${this.clientUrl}/main.aspx?etn=${entityName}&id=${entityId}&newWindow=true&pagetype=entityrecord`, '_blank');
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
      var entityId = this.Xrm.Page.data.entity.getId();
      if (entityId) {
        var locationUrl = `${this.clientUrl}/main.aspx?etn=${this.Xrm.Page.data.entity.getEntityName()}&id=${entityId}&newWindow=true&pagetype=entityrecord`;
        prompt('Ctrl+C to copy. OK to close.', locationUrl);
      }
  }
  
  copyRecordId() {
      var entityId = this.Xrm.Page.data.entity.getId();
      if (entityId) {
        prompt('Ctrl+C to copy. OK to close.', this.Xrm.Page.data.entity.getId());
      }
  }
  
  openSecurity() {
    window.open(`${this.clientUrl}/tools/AdminSecurity/adminsecurity_area.aspx`);
  }
  
  openSystemJobs() {
    window.open(`${this.clientUrl}/tools/business/home_asyncoperation.aspx`);
  }
  
  openSolutions() {
    window.open(`${this.clientUrl}/main.aspx?Origin=Portal&page=Settings&area=nav_solution`);
  }
  
  openProcesses() {
    window.open(`${this.clientUrl}/_root/homepage.aspx?etc=4703&pagemode=iframe&sitemappath=Settings|ProcessCenter|nav_workflow`);
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
        window.open(`${this.clientUrl}/main.aspx?extraqs=EntityCode%3d${Xrm.Internal.getEntityCode(entityName)}&pagetype=advancedfind`,'_blank');
    }
  }
  
  mocaClient() {
      var url = Xrm.Page.context.isOffice365() ? this.Xrm.Page.context.getClientUrl() : window.location.origin;
      window.open(`${url}/nga/main.htm?org=${this.Xrm.Page.context.getOrgUniqueName()}&server= ${url}`);
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
        case 'memo': {
            a.setValue('memo');
            break;
          }
        case 'string': {
            a.setValue('string');
            break;
          }
        case 'boolean': {
            a.setValue(false);
            break
          }
        case 'datetime': {
            a.setValue(new Date());
            break;
          }
        case 'decimal': {
            a.setValue(a.getMin());
            break;
          }
        case 'double': {
            a.setValue(a.getMin());
            break;
          }
        case 'integer': {
            a.setValue(a.getMin());
            break;
          }
        case 'lookup': {
            a.setValue(0);
            break;
          }
        case 'money': {
            a.setValue(a.getMin());
            break;
          }
        case 'optionset': {
            let options = a.getOptions();
            a.setValue(options[0].value);
          }
        }
      }
    });
  }
  
  environmentDetails() {
    let version = Xrm.Page.context.getVersion ? Xrm.Page.context.getVersion() : APPLICATION_VERSION;
    let headers = new Headers({
      "Accept" : "application/json",
      "Content-Type" : "application/json; charset=utf-8",
    });
    let serviceUrl = `${this.clientUrl}/XRMServices/2011/OrganizationData.svc/OrganizationSet?$select=SqlAccessGroupName,ReportingGroupName,
    PrivReportingGroupName,MaxRecordsForLookupFilters,
    MaxRecordsForExportToExcel,IsFullTextSearchEnabled,
    IsUserAccessAuditEnabled,IsDuplicateDetectionEnabled,
    QuickFindRecordLimitEnabled,IsAutoSaveEnabled,
    IsPresenceEnabled,IsAuditEnabled,
    SchemaNamePrefix,DisplayNavigationTour,
    MaxUploadFileSize`;
    if(version.startsWith('8')) {
        headers = new Headers({
          "Accept" : "application/json",
          "Content-Type" : "application/json; charset=utf-8",
          "OData-MaxVersion" : "4.0",
          "OData-Version" : "4.0"
        });
        serviceUrl = `/api/data/v8.0/organizations?$select=sqlaccessgroupname,reportinggroupname,privreportinggroupname,maxrecordsforlookupfilters,maxrecordsforexporttoexcel,isfulltextsearchenabled,isuseraccessauditenabled,isduplicatedetectionenabled,quickfindrecordlimitenabled,isautosaveenabled,ispresenceenabled,isauditenabled,schemanameprefix,displaynavigationtour,maxuploadfilesize,cortanaproactiveexperienceenabled,uselegacyrendering`;
    }
    fetch(serviceUrl, {
      method : 'GET',
      headers : headers,
      credentials : 'include'
    }).then((response) => {
      return response.json();
    }).then((c) => {
      let settingsArray = [];
      let settings = {};
      if(c.d){
        settings = c.d.results[0];
      }
      else if (c.value && c.value.length > 0) {
        settings = c.value[0];
      }
      for(let s in settings) { 
        settingsArray.push({name: s, value: settings[s]});
      }
      this.messageExtension(settingsArray);      
    }).catch ((err) => {
      console.log(err);
    });    
  }
}

var RYR = new LevelUp();

window.addEventListener('message', function(event) {
  if(event.source.Xrm && event.data.type){
    var clientUrl = event.source.Xrm.Page.context.getClientUrl();
    var orgUniqueName = Xrm.Page.context.getOrgUniqueName();
    //This is for differentiating between OnPrem, OnPrem on IFD or CRM Online
    var cleanedClientUrl = !clientUrl.endsWith(orgUniqueName) ? clientUrl : clientUrl.substr(0, clientUrl.lastIndexOf('/'));
    if(event.origin !== cleanedClientUrl) return;
    
    RYR.clientUrl = clientUrl;
    
    let contentPanels = Array.from(document.querySelectorAll('iframe')).filter(function (d) {
        return d.style.visibility !== 'hidden'
      });
      
    if (contentPanels && contentPanels.length > 0) {
      RYR.formWindow = contentPanels[0].contentWindow;
      RYR.Xrm = RYR.formWindow.Xrm;
    }

    if(event.data.category === 'form' && !this.Xrm.Page.data) {
        alert('CRM Form is not open');
        return;
    }
    try{
      RYR[event.data.type]();
    }catch(e){
      console.error(e);
    }
  }
});