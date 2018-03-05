import { Transaction, TransactionWithUUID } from './transaction';
import { Account } from './account';
import * as moment from 'moment';

export type TransactionMap = { [k: string]: TransactionWithUUID };
export type AccountMap = { [k: string]: Account };

export interface AppState {
  entities: {
    transactions: TransactionMap;
  };
  computed: {
    accounts: AccountMap;
    invalidTransactions: string[],
  };
  ui: {
    rootAccount: string;
    editedTransaction?: Transaction | TransactionWithUUID;
    isLeftMenuOpen: boolean;
    persistedAt?: moment.Moment;
    isLoading: boolean,
    filters: {
      selectedAccounts: string[];
      input: string,
      showOnlyInvalid: boolean,
      minDate?: number,
      maxDate?: number,
    },
  };
}
