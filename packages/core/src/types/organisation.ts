export interface Organisation {
  OrganisationId: number;
  Name: string;
  TaxNumber?: string;
  RegistrationNumber?: string;
  Address?: string;
  City?: string;
  PostalCode?: string;
  Country?: string;
  CountryCode?: string;
  Email?: string;
  Phone?: string;
  WebSite?: string;
  IBAN?: string;
  BankName?: string;
  VATPayerStatus?: string;
  FiscalYear?: number;
}
