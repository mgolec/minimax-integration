import type { HttpClient } from '../http.js';
import type { SearchResult, ListParams } from '../types/common.js';
import type { InboxItem } from '../types/inbox.js';
import type { ReceivedInvoice } from '../types/received-invoice.js';

export class InboxModule {
  constructor(private http: HttpClient) {}

  async list(orgId: number, params?: ListParams): Promise<SearchResult<InboxItem>> {
    const query: Record<string, string | number | boolean | undefined> = {
      PageSize: params?.pageSize ?? 50,
      CurrentPage: params?.currentPage ?? 1,
      Sorting: params?.sorting,
      AdditionalFields: params?.additionalFields,
    };
    if (params?.filter) query.Filter = params.filter;
    return this.http.get<SearchResult<InboxItem>>(`/orgs/${orgId}/inbox`, query);
  }

  async get(orgId: number, inboxId: number): Promise<InboxItem> {
    return this.http.get<InboxItem>(`/orgs/${orgId}/inbox/${inboxId}`);
  }

  async approve(orgId: number, inboxId: number, reason?: string): Promise<void> {
    await this.http.put(`/orgs/${orgId}/inbox/${inboxId}/actions/approve`, { Reason: reason });
  }

  async reject(orgId: number, inboxId: number, reason: string): Promise<void> {
    await this.http.put(`/orgs/${orgId}/inbox/${inboxId}/actions/reject`, { Reason: reason });
  }

  async createReceivedInvoice(orgId: number, inboxId: number): Promise<ReceivedInvoice> {
    return this.http.put<ReceivedInvoice>(
      `/orgs/${orgId}/inbox/${inboxId}/actions/createReceivedInvoice`,
      {},
    );
  }
}
