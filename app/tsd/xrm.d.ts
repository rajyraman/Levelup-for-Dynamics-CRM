declare namespace Xrm {
  interface EntityDefinition {
    EntitySetName: string;
  }
  namespace Attributes {
    interface LookupAttribute {
      getLookupTypes(): LookupValue[];
    }
  }
  namespace Controls {
    interface Control {
      getAttribute(): Xrm.Attributes.Attribute;
    }
  }
  namespace Page {
    interface LookupValue {
      type: string;
      typename: string;
    }
  }
  interface Ui {
    getCurrentControl(): Xrm.Controls.Control;
  }
  interface XrmStatic {
    Internal: XrmInternal;
  }

  interface XrmInternal {
    getEntityCode(entityName: string): number;
    isUci(): boolean;
  }
  interface GlobalContext {
    isOffice365(): boolean;
    isOnPremises(): boolean;
  }
}
