var RYR = {
  Xrm : undefined,
  formWindow : undefined,
  runtimeChannel: undefined,
  extensionId: undefined,
  clientUrl: undefined
};

(function(){
  RYR.openRecord = function(formWindow, Xrm){
    var entityName = prompt("Entity?", ""), entityId = prompt("Id?", "");
    window.open(`${RYR.clientUrl}/main.aspx?etn=${entityName}&id=${entityId}&newWindow=true&pagetype=entityrecord`, '_blank');
  };
  
  RYR.displayLogicalNames = function(formWindow, Xrm){
      if(!Xrm.Page.data) {
        alert('CRM Form is not open');
        return;
      }
      Xrm.Page.ui.tabs.forEach(function (tab) {
        tab.setVisible(true);
        tab.sections.forEach(function (section) {
          section.setVisible(true);
        });
      });
      var $ = formWindow.jQuery || (formWindow.CEI && formWindow.CEI.$);
      if (!$) {
        var head = formWindow.document.getElementsByTagName('head').item(0);
        var s = formWindow.document.createElement('script');
        s.setAttribute('type', 'text/javascript');
        s.setAttribute('src', 'https://ajax.aspnetcdn.com/ajax/jquery/jquery-1.9.0.js');
        s.async = false;
        head.appendChild(s);
        waitForJQ();
      } else {
        setLabels();
      }
      function waitForJQ() {
        if (formWindow.jQuery) {
          $ = formWindow.jQuery.noConflict(true);
          setLabels();
        } else {
          setTimeout(waitForJQ, 1000);
        }
      }
      function setLabels() {
        Xrm.Page.data.entity.attributes.forEach(function (a) {
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
              $(this).select()
            });
            $('<span></span>').text(lblText).appendTo(lbl);
          });
        });
      }
  };
  
  RYR.godMode = function(formWindow, Xrm) {
      if(!Xrm.Page.data) {
        alert('CRM Form is not open');
        return;
      }    
      try {
        formWindow.Mscrm.InlineEditDataService.get_dataService().validateAndFireSaveEvents = function () {
          return new Mscrm.SaveResponse(5, "")
        }
      } catch (e) {}

      var attrs = Xrm.Page.data.entity.attributes.get();
      for (var i in attrs) {
        attrs[i].setRequiredLevel("none")
      }
      var contrs = Xrm.Page.ui.controls.get();
      for (var i in contrs) {
        try {
          contrs[i].setVisible(true);
          contrs[i].setDisabled(false);
          contrs[i].clearNotification()
        } catch (e) {}

      }
      var tabs = Xrm.Page.ui.tabs.get();
      for (var i in tabs) {
        tabs[i].setVisible(true);
        tabs[i].setDisplayState("expanded");
        var sects = tabs[i].sections.get();
        for (var i in sects) {
          sects[i].setVisible(true)
        }
      }
  };
  
  RYR.formProperties = function(formWindow, Xrm){
    if(!Xrm.Page.data) {
      alert('CRM Form is not open');
      return;
    }       
    var id = Xrm.Page.data.entity.getId();
    var etc = Xrm.Page.context.getQueryStringParameters().etc;
    formWindow.Mscrm.RibbonActions.openFormProperties(id, etc);
  };
  
  RYR.copyRecordUrl = function(formWindow, Xrm){
      if(!Xrm.Page.data) {
        alert('CRM Form is not open');
        return;
      }       
      var entityId = Xrm.Page.data.entity.getId();
      if (entityId) {
        var locationUrl = `${RYR.clientUrl}/main.aspx?etn=${Xrm.Page.data.entity.getEntityName()}&id=${entityId}&newWindow=true&pagetype=entityrecord`;
        prompt('Ctrl+C to copy. OK to close.', locationUrl);
      }
  };
  
  RYR.copyRecordId = function(formWindow, Xrm){
      if(!Xrm.Page.data) {
        alert('CRM Form is not open');
        return;
      }       
      var entityId = Xrm.Page.data.entity.getId();
      if (entityId) {
        prompt('Ctrl+C to copy. OK to close.', Xrm.Page.data.entity.getId());
      }
  };
  
  RYR.openSecurity = function(formWindow, Xrm){
    window.open(`${RYR.clientUrl}/tools/AdminSecurity/adminsecurity_area.aspx`);
  };
  
  RYR.openSystemJobs = function(formWindow, Xrm){
    window.open(`${RYR.clientUrl}/tools/business/home_asyncoperation.aspx`);
  };
  
  RYR.openSolutions = function(formWindow, Xrm){
    window.open(`${RYR.clientUrl}/main.aspx?Origin=Portal&page=Settings&area=nav_solution`);
  };
  
  RYR.openProcesses = function(formWindow, Xrm) {
    window.open(`${RYR.clientUrl}/_root/homepage.aspx?etc=4703&pagemode=iframe&sitemappath=Settings|ProcessCenter|nav_workflow`);
  };
  
  RYR.highlightDirtyFields = function(formWindow, Xrm){
      Xrm.Page.data.entity.addOnSave(function (econtext) {
        var eventArgs = econtext.getEventArgs();
        if (eventArgs.getSaveMode() == 70 || eventArgs.getSaveMode() == 2) {
          eventArgs.preventDefault();
        }
      });
      var dirtyAttributes = [];
      Xrm.Page.ui.controls.forEach(function (c) {
        if (c.getAttribute && c.getAttribute() && c.getAttribute().getIsDirty()) {
          if (c.get_chromeElement)
            c.get_chromeElement().attr('style', 'border: 1px solid red');
          else
            dirtyAttributes.push(c.getAttribute().getName());
          c.getAttribute().setSubmitMode('never');
        }
      });
      if (dirtyAttributes.length > 0)
        alert('Dirty attributes "' + dirtyAttributes.join(',') + '" will not be submitted on save');
  };
  
  RYR.openMain = function(){
    window.open(`${RYR.clientUrl}/main.aspx`,'_blank');
  };
  
  window.RYR = RYR;
})();


window.addEventListener('message', function(event) {
  if(event.source.Xrm && event.data.type){
    var clientUrl = event.source.Xrm.Page.context.getClientUrl();
    if(event.origin !== clientUrl.substr(0, clientUrl.lastIndexOf('/'))) return;
    var contentPanels = Array.from(document.querySelectorAll('iframe')).filter(function (d) {
        return d.style.visibility !== 'hidden'
      });
      
    if (contentPanels && contentPanels.length > 0) {
      RYR.formWindow = contentPanels[0].contentWindow;
      RYR.Xrm = RYR.formWindow.Xrm;
      RYR.clientUrl = RYR.Xrm.Page.context.getClientUrl();
    }
    RYR[event.data.type](RYR.formWindow, RYR.Xrm);
  }
});