import type { HttpClient } from '../http.js';
import type { SearchResult, ListParams } from '../types/common.js';
import type { Customer, CustomerCreateInput } from '../types/customer.js';

export class CustomersModule {
  constructor(private http: HttpClient) {}

  async list(orgId: number, params?: ListParams & { searchString?: string }): Promise<SearchResult<Customer>> {
    const query: Record<string, string | number | boolean | undefined> = {
      PageSize: params?.pageSize ?? 50,
      CurrentPage: params?.currentPage ?? 1,
      Sorting: params?.sorting,
      AdditionalFields: params?.additionalFields,
    };
    if (params?.filter) query.Filter = params.filter;
    if (params?.searchString) query.SearchString = params.searchString;
    return this.http.get<SearchResult<Customer>>(`/orgs/${orgId}/customers`, query);
  }

  async get(orgId: number, customerId: number): Promise<Customer> {
    return this.http.get<Customer>(`/orgs/${orgId}/customers/${customerId}`);
  }

  async create(orgId: number, data: CustomerCreateInput): Promise<Customer> {
    return this.http.post<Customer>(`/orgs/${orgId}/customers`, data);
  }

  async update(orgId: number, customerId: number, data: Partial<Customer>): Promise<Customer> {
    return this.http.put<Customer>(`/orgs/${orgId}/customers/${customerId}`, data);
  }

  async delete(orgId: number, customerId: number): Promise<void> {
    await this.http.delete(`/orgs/${orgId}/customers/${customerId}`);
  }

  async lookupByTaxNumber(orgId: number, taxNumber: string): Promise<Customer> {
    return this.http.post<Customer>(`/orgs/${orgId}/customers/addbytaxnumber(${taxNumber})`, {});
  }
}
