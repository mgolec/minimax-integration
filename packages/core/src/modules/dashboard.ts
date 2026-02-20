import type { HttpClient } from '../http.js';
import type { Dashboard } from '../types/dashboard.js';

export class DashboardModule {
  constructor(private http: HttpClient) {}

  async get(orgId: number): Promise<Dashboard> {
    return this.http.get<Dashboard>(`/orgs/${orgId}/dashboards`);
  }
}
