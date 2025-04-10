declare class List {
  constructor(element: HTMLElement | string, options?: ListOptions, values?: any[]);
  add(values: any[]): void;
  remove(value: any): void;
  get(value: any): any;
  sort(sortName: string, options?: SortOptions): void;
  filter(filters: FilterOptions): void;
  search(searchString: string, columns?: string[]): void;
  clear(): void;
  size(): number;
  show(i: number, page: number): void;
  update(): void;
}

interface ListOptions {
  valueNames?: string[];
  item?: string;
  listClass?: string;
  searchClass?: string;
  sortClass?: string;
  indexAsync?: boolean;
  page?: number;
  pagination?: boolean;
  fuzzySearch?: boolean;
  searchColumns?: string[];
}

interface SortOptions {
  order?: 'asc' | 'desc';
  alphabet?: string;
  insensitive?: boolean;
}

interface FilterOptions {
  [key: string]: string | number | boolean;
}
