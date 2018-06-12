export interface Posting {
  tag?: string;
  account: string;
  amount?: string;
  currency?: string;
  comment?: string;
  readonly tags: string[],
}
