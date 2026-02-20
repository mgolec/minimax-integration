import type { HttpClient } from '../http.js';
import type { Organisation } from '../types/organisation.js';

export class OrganisationsModule {
  constructor(private http: HttpClient) {}

  async list(): Promise<Organisation[]> {
    return this.http.get<Organisation[]>('/orgs/allOrgs');
  }

  async get(orgId: number): Promise<Organisation> {
    return this.http.get<Organisation>(`/orgs/${orgId}`);
  }
}
