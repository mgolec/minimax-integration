import type { FkField } from './common.js';

export interface Customer {
  CustomerId: number;
  Name: string;
  Code?: string;
  TaxNumber?: string;
  RegistrationNumber?: string;
  Address?: string;
  City?: string;
  PostalCode?: string;
  Country?: FkField;
  Email?: string;
  Phone?: string;
  IBAN?: string;
  BankName?: string;
  IsCustomer?: boolean;
  IsSupplier?: boolean;
  RowVersion?: string;
  [key: string]: unknown;
}

export interface CustomerCreateInput {
  Name: string;
  Code?: string;
  TaxNumber?: string;
  RegistrationNumber?: string;
  Address?: string;
  City?: string;
  PostalCode?: string;
  Country?: FkField;
  Email?: string;
  Phone?: string;
  IBAN?: string;
  IsCustomer?: boolean;
  IsSupplier?: boolean;
}
