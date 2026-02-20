import type { HttpClient } from '../http.js';
import type { SearchResult, FkField } from '../types/common.js';
import type { Organisation } from '../types/organisation.js';

export interface OrganisationListItem {
  Organisation: FkField;
  APIAccess?: string;
  MobileAccess?: string;
}

export class OrganisationsModule {
  constructor(private http: HttpClient) {}

  async list(): Promise<SearchResult<OrganisationListItem>> {
    return this.http.get<SearchResult<OrganisationListItem>>('/currentuser/orgs');
  }

  async get(orgId: number): Promise<Organisation> {
    return this.http.get<Organisation>(`/orgs/${orgId}`);
  }
}
