import type { HttpClient } from '../http.js';
import type { SearchResult, ListParams } from '../types/common.js';
import type { IssuedInvoice, IssuedInvoiceCreateInput, IssuedInvoiceAction } from '../types/issued-invoice.js';

export interface IssuedInvoiceListParams extends ListParams {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  customerId?: number;
  paymentStatus?: string;
}

export class IssuedInvoicesModule {
  constructor(private http: HttpClient) {}

  async list(orgId: number, params?: IssuedInvoiceListParams): Promise<SearchResult<IssuedInvoice>> {
    const query: Record<string, string | number | boolean | undefined> = {
      PageSize: params?.pageSize ?? 50,
      CurrentPage: params?.currentPage ?? 1,
      Sorting: params?.sorting,
      AdditionalFields: params?.additionalFields,
    };
    if (params?.filter) query.Filter = params.filter;
    if (params?.dateFrom) query.DateFrom = params.dateFrom;
    if (params?.dateTo) query.DateTo = params.dateTo;
    if (params?.status) query.Status = params.status;
    if (params?.customerId) query.CustomerId = params.customerId;
    if (params?.paymentStatus) query.PaymentStatus = params.paymentStatus;
    return this.http.get<SearchResult<IssuedInvoice>>(`/orgs/${orgId}/issuedinvoices`, query);
  }

  async get(orgId: number, invoiceId: number): Promise<IssuedInvoice> {
    return this.http.get<IssuedInvoice>(`/orgs/${orgId}/issuedinvoices/${invoiceId}`);
  }

  async create(orgId: number, data: IssuedInvoiceCreateInput): Promise<IssuedInvoice> {
    return this.http.post<IssuedInvoice>(`/orgs/${orgId}/issuedinvoices`, data);
  }

  async update(orgId: number, invoiceId: number, data: Partial<IssuedInvoice>): Promise<IssuedInvoice> {
    return this.http.put<IssuedInvoice>(`/orgs/${orgId}/issuedinvoices/${invoiceId}`, data);
  }

  async delete(orgId: number, invoiceId: number): Promise<void> {
    await this.http.delete(`/orgs/${orgId}/issuedinvoices/${invoiceId}`);
  }

  async performAction(
    orgId: number,
    invoiceId: number,
    action: IssuedInvoiceAction,
    rowVersion: string,
  ): Promise<IssuedInvoice> {
    return this.http.put<IssuedInvoice>(
      `/orgs/${orgId}/issuedinvoices/${invoiceId}/actions/${action}_${rowVersion}`,
      {},
    );
  }

  async issue(orgId: number, invoiceId: number, rowVersion: string): Promise<IssuedInvoice> {
    return this.performAction(orgId, invoiceId, 'issue', rowVersion);
  }

  async issueAndGeneratePdf(orgId: number, invoiceId: number, rowVersion: string): Promise<IssuedInvoice> {
    return this.performAction(orgId, invoiceId, 'issueAndGeneratepdf', rowVersion);
  }

  async generatePdf(orgId: number, invoiceId: number, rowVersion: string): Promise<IssuedInvoice> {
    return this.performAction(orgId, invoiceId, 'generatepdf', rowVersion);
  }
}
