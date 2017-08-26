declare function List(listName: string, keys: {valueNames: string[]}) : void;
declare namespace Mscrm{
  var RibbonActions: {
    openEntityEditor: (etc: number) => void;
    openFormProperties: (id: string, etc: number) => void;
  };
  var Performance: {
    PerformanceCenter: {get_instance: () => {TogglePerformanceResultsVisibility: () => void}} 
  }; 
}