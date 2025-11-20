export type QuotationItemBase = {
  type: 'item';
  item: string;
  unit_price: number | string; // % 가능
  qty: number;
  amount: number;
  remarks: string;
  depth: number;
};

export type QuotationTitleRow = {
  type: 'title';
  item: string;
  depth: number;
};

export type QuotationSubtotal = {
  type: 'subtotal';
  label: string;
  amount: number;
};

export type QuotationGrandTotal = {
  type: 'grandtotal';
  label: string;
  amount: number;
};

export type QuotationDiscount = {
  type: 'discount';
  label: string;
  unit_price: string;
  amount: number;
};

export type QuotationAgencyFee = {
  type: 'agency_fee';
  label: string;
  unit_price: string | number;
  amount: number;
  remarks: string;
};

export type QuotationMappedItem =
  | QuotationItemBase
  | QuotationTitleRow
  | QuotationSubtotal
  | QuotationGrandTotal
  | QuotationDiscount
  | QuotationAgencyFee;
