module LevelUp {
    window.addEventListener('message', function(event) {
        let utility:LevelUp.Common.Utility;
        //home.dynamics.com also messaging. Ignore.
        if(location.origin !== event.origin) return;
        
        if(event.source.Xrm && event.data.type){
          let clientUrl = event.source.Xrm.Page.context.getClientUrl();
          //This is for differentiating between OnPrem, OnPrem on IFD or CRM Online
          let cleanedClientUrl = !clientUrl.endsWith(Xrm.Page.context.getOrgUniqueName()) ? 
                                clientUrl : clientUrl.substr(0, clientUrl.lastIndexOf('/'));  
          if(event.origin !== cleanedClientUrl) return;
          let contentPanels = Array.from(document.querySelectorAll('iframe')).filter(function (d) {
              return d.style.visibility !== 'hidden'
            });
            
          if (contentPanels && contentPanels.length > 0) {
            let formWindow = contentPanels[0].contentWindow;
            let formDocument = contentPanels[0].contentDocument;
            let xrm = formWindow.Xrm;
            utility = new LevelUp.Common.Utility(formDocument, formWindow, xrm, clientUrl);
          }
      
          if((<LevelUp.Types.ExtensionMessage>event.data).category === "Forms" && !Xrm.Page.data) {
              alert('This command can only be performed in the context of a form');
              return;
          }
          try{
              let message = (<LevelUp.Types.ExtensionMessage>event.data);
              switch(message.category) {
                  case "Forms":
                    new LevelUp.Forms(utility)[message.type]();
                    break;
                  case "API":
                    new LevelUp.Service(utility)[message.type]();
                    break;
                  case "Grid":
                    new LevelUp.Grid(utility)[message.type]();
                    break;
                  case "Navigation":
                    new LevelUp.Navigation(utility)[message.type]();
                    break;                                                            
              }
            //RYR[event.data.type]();
          }catch(e){
            console.error(e);
          }
        }
      });    
}