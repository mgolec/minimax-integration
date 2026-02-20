import { resolveConfig, type MinimaxConfig } from './config.js';
import { TokenManager } from './auth.js';
import { HttpClient } from './http.js';
import { RateLimiter, type RateLimitStatus } from './rate-limiter.js';
import { OrganisationsModule } from './modules/organisations.js';
import { DashboardModule } from './modules/dashboard.js';
import { CustomersModule } from './modules/customers.js';
import { IssuedInvoicesModule } from './modules/issued-invoices.js';
import { ReceivedInvoicesModule } from './modules/received-invoices.js';
import { InboxModule } from './modules/inbox.js';
import { JournalsModule } from './modules/journals.js';
import { ItemsModule } from './modules/items.js';

export class MinimaxClient {
  public readonly organisations: OrganisationsModule;
  public readonly dashboard: DashboardModule;
  public readonly customers: CustomersModule;
  public readonly issuedInvoices: IssuedInvoicesModule;
  public readonly receivedInvoices: ReceivedInvoicesModule;
  public readonly inbox: InboxModule;
  public readonly journals: JournalsModule;
  public readonly items: ItemsModule;

  private readonly tokenManager: TokenManager;
  private readonly rateLimiter: RateLimiter;
  private readonly http: HttpClient;
  private readonly config: MinimaxConfig;

  constructor(explicitConfig?: Partial<MinimaxConfig>) {
    this.config = resolveConfig(explicitConfig);
    this.tokenManager = new TokenManager(this.config);
    this.rateLimiter = new RateLimiter();
    this.http = new HttpClient(this.config.baseUrl, this.tokenManager, this.rateLimiter);

    this.organisations = new OrganisationsModule(this.http);
    this.dashboard = new DashboardModule(this.http);
    this.customers = new CustomersModule(this.http);
    this.issuedInvoices = new IssuedInvoicesModule(this.http);
    this.receivedInvoices = new ReceivedInvoicesModule(this.http);
    this.inbox = new InboxModule(this.http);
    this.journals = new JournalsModule(this.http);
    this.items = new ItemsModule(this.http);
  }

  get defaultOrgId(): number | undefined {
    return this.config.orgId;
  }

  requireOrgId(orgId?: number): number {
    const id = orgId ?? this.config.orgId;
    if (!id) throw new Error('Organization ID is required. Pass orgId or set MINIMAX_ORG_ID.');
    return id;
  }

  getRateLimitStatus(): RateLimitStatus {
    return this.rateLimiter.getStatus();
  }

  async authenticate(): Promise<void> {
    await this.tokenManager.authenticate();
  }

  clearAuth(): void {
    this.tokenManager.clearToken();
  }
}
