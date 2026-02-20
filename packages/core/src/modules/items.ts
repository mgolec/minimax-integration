import type { HttpClient } from '../http.js';
import type { SearchResult, ListParams, FkField } from '../types/common.js';

export interface Item {
  ItemId: number;
  Code?: string;
  Name: string;
  Description?: string;
  UnitOfMeasurement?: string;
  Price?: number;
  VATRate?: FkField;
  Account?: FkField;
  ItemType?: string;
  RowVersion?: string;
  [key: string]: unknown;
}

export class ItemsModule {
  constructor(private http: HttpClient) {}

  async list(orgId: number, params?: ListParams & { searchString?: string }): Promise<SearchResult<Item>> {
    const query: Record<string, string | number | boolean | undefined> = {
      PageSize: params?.pageSize ?? 50,
      CurrentPage: params?.currentPage ?? 1,
      Sorting: params?.sorting,
    };
    if (params?.filter) query.Filter = params.filter;
    if (params?.searchString) query.SearchString = params.searchString;
    return this.http.get<SearchResult<Item>>(`/orgs/${orgId}/items`, query);
  }

  async get(orgId: number, itemId: number): Promise<Item> {
    return this.http.get<Item>(`/orgs/${orgId}/items/${itemId}`);
  }
}
