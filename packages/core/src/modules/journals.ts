import type { HttpClient } from '../http.js';
import type { SearchResult, ListParams } from '../types/common.js';
import type { Journal, JournalCreateInput, JournalEntry, VatEntry } from '../types/journal.js';

export class JournalsModule {
  constructor(private http: HttpClient) {}

  async list(orgId: number, params?: ListParams): Promise<SearchResult<Journal>> {
    const query: Record<string, string | number | boolean | undefined> = {
      PageSize: params?.pageSize ?? 50,
      CurrentPage: params?.currentPage ?? 1,
      Sorting: params?.sorting,
      AdditionalFields: params?.additionalFields,
    };
    if (params?.filter) query.Filter = params.filter;
    return this.http.get<SearchResult<Journal>>(`/orgs/${orgId}/journals`, query);
  }

  async get(orgId: number, journalId: number): Promise<Journal> {
    return this.http.get<Journal>(`/orgs/${orgId}/journals/${journalId}`);
  }

  async create(orgId: number, data: JournalCreateInput): Promise<Journal> {
    return this.http.post<Journal>(`/orgs/${orgId}/journals`, data);
  }

  async update(orgId: number, journalId: number, data: Partial<Journal>): Promise<Journal> {
    return this.http.put<Journal>(`/orgs/${orgId}/journals/${journalId}`, data);
  }

  async delete(orgId: number, journalId: number): Promise<void> {
    await this.http.delete(`/orgs/${orgId}/journals/${journalId}`);
  }

  async listEntries(orgId: number, params?: ListParams): Promise<SearchResult<JournalEntry>> {
    const query: Record<string, string | number | boolean | undefined> = {
      PageSize: params?.pageSize ?? 100,
      CurrentPage: params?.currentPage ?? 1,
    };
    return this.http.get<SearchResult<JournalEntry>>(`/orgs/${orgId}/journal-entries`, query);
  }

  // VAT entries on a journal
  async listVatEntries(orgId: number, journalId: number): Promise<VatEntry[]> {
    return this.http.get<VatEntry[]>(`/orgs/${orgId}/journals/${journalId}/vat`);
  }

  async createVatEntry(orgId: number, journalId: number, data: VatEntry): Promise<VatEntry> {
    return this.http.post<VatEntry>(`/orgs/${orgId}/journals/${journalId}/vat`, data);
  }
}
