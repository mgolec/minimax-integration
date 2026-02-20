import type { HttpClient } from '../http.js';
import type { SearchResult, ListParams } from '../types/common.js';
import type { ReceivedInvoice } from '../types/received-invoice.js';

export interface ReceivedInvoiceListParams extends ListParams {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  customerId?: number;
  paymentStatus?: string;
}

export class ReceivedInvoicesModule {
  constructor(private http: HttpClient) {}

  async list(orgId: number, params?: ReceivedInvoiceListParams): Promise<SearchResult<ReceivedInvoice>> {
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
    return this.http.get<SearchResult<ReceivedInvoice>>(`/orgs/${orgId}/receivedinvoices`, query);
  }

  async get(orgId: number, invoiceId: number): Promise<ReceivedInvoice> {
    return this.http.get<ReceivedInvoice>(`/orgs/${orgId}/receivedinvoices/${invoiceId}`);
  }
}
