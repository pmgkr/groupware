export type QuotationItemBase = {
  type: 'item';
  item: string;
  unit_price: number | string; // % 가능
  qty: number;
  amount: number;
  cost?: number;
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
  item: string;
  amount: number;
};

export type QuotationGrandTotal = {
  type: 'grandtotal';
  item: string;
  amount: number;
};

export type QuotationDiscount = {
  type: 'discount';
  item: string;
  unit_price: string;
  amount: number;
  remarks?: string;
};

export type QuotationTotalAmount = {
  type: 'totalamount';
  item: string;
  amount: number;
  remarks?: string;
};

export type QuotationTax = {
  type: 'tax';
  item: string;
  amount: number;
  remarks?: string;
};

export type QuotationAgencyFee = {
  type: 'agency_fee';
  item: string;
  unit_price: string | number;
  amount: number;
  remarks?: string;
};

export type QuotationMappedItem =
  | QuotationItemBase
  | QuotationTitleRow
  | QuotationSubtotal
  | QuotationGrandTotal
  | QuotationDiscount
  | QuotationTotalAmount
  | QuotationTax
  | QuotationAgencyFee;

// 비용 - 견적서 매칭하기 위한 정보
export type expenseInfo = {
  seq: number;
  ei_amount: number;
};
