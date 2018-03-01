import { Posting } from './posting';

export interface Transaction {
  readonly header: Header;
  readonly postings: Array<Posting>;
}

interface Header {
  readonly date: number;
  readonly title: string;
  readonly tag?: string;
}

export interface TransactionWithUUID extends Transaction {
  readonly uuid: string;
}
