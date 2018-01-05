export interface Posting {
  tag?: string;
  account: string;
  amount?: decimal.Decimal;
  currency?: string;
  comment?: string;
}

