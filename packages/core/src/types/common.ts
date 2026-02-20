/** Foreign key reference field - standard Minimax pattern */
export interface FkField {
  ID: number;
  Name?: string;
  ResourceUrl?: string;
}

/** Paginated list result from Minimax API */
export interface SearchResult<T> {
  Rows: T[];
  TotalRows: number;
  CurrentPageNumber: number;
}

/** Common params for list endpoints */
export interface ListParams {
  pageSize?: number;
  currentPage?: number;
  sorting?: string;
  additionalFields?: string;
  filter?: string;
}
