import { Transaction, TransactionWithUUID } from './transaction';
import { Account } from './account';
import * as moment from 'moment';

export type TransactionMap = { [k: string]: TransactionWithUUID };
export type AccountMap = { [k: string]: Account };
export interface Tabs { [k: string]: Tab; }
export interface Ui {
  tabs: Tabs;
  isLeftMenuOpen: boolean;
  persistedAt?: moment.Moment;
  isLoading: boolean;
}
export interface Filters {
  input: string;
  showOnlyInvalid: boolean;
  minDate?: number;
  maxDate?: number;
  tags: string[];
}

export interface Tab {
  id: string;
  selectedAccounts: string[];
  editedTransaction?: Transaction | TransactionWithUUID;
  filters: Filters;
  isClosable: boolean;
}

export interface AppState {
  entities: {
    transactions: TransactionMap;
  };
  computed: {
    accounts: AccountMap;
    invalidTransactions: string[],
  };
  ui: Ui;
}
