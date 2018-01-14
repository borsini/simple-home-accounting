import Decimal from 'decimal.js';

export interface Posting {
  tag?: string;
  account: string;
  amount?: Decimal;
  currency?: string;
  comment?: string;
}
