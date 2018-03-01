import { Transaction, TransactionWithUUID } from './transaction';
import { ReduxAccount } from './account';
import * as moment from 'moment';

export type TransactionMap = { [k: string]: TransactionWithUUID };
export type AccountMap = { [k: string]: ReduxAccount };

export interface AppState {
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
