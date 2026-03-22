export interface ExpenseTrackingChargeRow {
  _id: string;
  entity?: string;
  date?: string;
  created?: string;
  description?: string;
  category?: string;
  amount?: {
    total?: {
      val?: number;
      cur?: string;
    };
  };
  meta?: {
    comment?: string;
    toconlineDocumentId?: number | string;
    uploadedDocumentUrl?: string | null;
    toconlineData?: {
      document_date?: string;
      supplier_business_name?: string;
      supplier_address_detail?: string;
      supplier_country?: string;
      tax_exemption_reason_id?: string;
      lines?: Array<{
        description?: string;
        tax_percentage?: number;
        tax_code?: string;
        unit_price?: number;
      }>;
    };
  };
}

export interface ToconlineDocumentLine {
  item_type?: string;
  item_id?: number;
  item_code?: string;
  description?: string;
  quantity?: number;
  unit_price?: number;
  net_unit_price?: number;
  tax_code?: string;
  tax_percentage?: number;
  [key: string]: unknown;
}

export interface ToconlineDocument {
  _id?: { $oid: string } | string;
  document_no?: string;
  date?: string;
  id?: number;
  status?: number;
  gross_total?: number;
  notes?: string;
  document_type?: string;
  pending_total?: number;
  supplier_tax_registration_number?: string;
  supplier_business_name?: string;
  supplier_address_detail?: string;
  supplier_postcode?: string;
  supplier_city?: string;
  supplier_tax_country_region?: string;
  supplier_country?: string;
  currency_iso_code?: string;
  external_reference?: string;
  lines?: ToconlineDocumentLine[];
  [key: string]: unknown;
}

export type ExpenseTrackingToconlineLink =
  | { status: 'none' }
  | { status: 'linked'; document: ToconlineDocument }
  | { status: 'pending'; toconlineDocumentId: number };

export type ExpenseTrackingCombinedEntry =
  | {
      kind: 'charge';
      charge: ExpenseTrackingChargeRow;
      toconline: ExpenseTrackingToconlineLink;
    }
  | { kind: 'toconline_orphan'; document: ToconlineDocument };
