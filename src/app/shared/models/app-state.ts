import { Transaction, TransactionWithUUID } from './transaction';
import { ReduxAccount } from './account';
import * as moment from 'moment';

export interface AppState {
  selectedAccounts: Set<Account>;
  rootAccount: Account;
  editedTransaction?: TransactionWithUUID;
  transactions: Map<string, TransactionWithUUID>;
  isLeftMenuOpen: boolean;
  isTransactionPanelOpen: boolean;
  persistedAt?: moment.Moment;
}


export type TransactionMap = { [k: string]: TransactionWithUUID };
export type AccountMap = { [k: string]: ReduxAccount };

export interface ReduxAppState {
  entities: {
    accounts: AccountMap;
    transactions: TransactionMap;
  };
  ui: {
    selectedAccounts: string[];
    rootAccount: string;
    editedTransaction?: string;
    isLeftMenuOpen: boolean;
    isTransactionPanelOpen: boolean;
    persistedAt?: moment.Moment;
    isLoading: boolean,
  };
}
