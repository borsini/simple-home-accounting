import {v4 as uuid } from 'uuid';
import Decimal from 'decimal.js';

import { ReduxAppState, TransactionMap, AccountMap } from './../models/app-state';
import { ReduxAccount } from '../models/account';
import { Action, AnyAction } from 'redux';
import { Transaction, TransactionWithUUID } from '../models/transaction';
import { Posting } from '../models/posting';

const ROOT_ACCOUNT = 'ROOT';

export const INITIAL_STATE: ReduxAppState = {
  entities: {
    accounts: { ROOT_ACCOUNT: new ReduxAccount(ROOT_ACCOUNT) },
    transactions: {},
  },
  ui: {
    selectedAccounts: [],
    rootAccount: ROOT_ACCOUNT,
    editedTransaction: undefined,
    isLeftMenuOpen: false,
    isTransactionPanelOpen: false,
    persistedAt: undefined,
    isLoading: false,
  },
};

export const selectEditedTransaction = (s: ReduxAppState) => {
  const id = s.ui.editedTransaction;
  return id ? s.entities.transactions[id] : undefined;
};

export const allTransactionsSelector = (s: ReduxAppState) => {
  return s.entities.transactions;
};

export const allAccountsSelector = (s: ReduxAppState) => {
  return s.entities.accounts;
};

export const isLeftMenuOpenSelector = (s: ReduxAppState) => {
  return s.ui.isLeftMenuOpen;
};

export const isTransactionPanelOpenSelector = (s: ReduxAppState) => {
  return s.ui.isTransactionPanelOpen;
};

export const isLoadingSelector = (s: ReduxAppState) => {
  return s.ui.isLoading;
};

export const selectedAccountsSelector = (s: ReduxAppState) => {
  return s.ui.selectedAccounts;
};

const transactionsUsingAccounts = (accountsNames: string[], allTransactions: TransactionWithUUID[]) => {
  if (accountsNames.find(n => n === ROOT_ACCOUNT)) {
    return allTransactions;
  }

  return allTransactions
    .filter(tr => {
    return tr.postings.some( p => accountsNames.indexOf(p.account) !== -1 );
  });
};

export const selectedTransactionsSelector = (s: ReduxAppState) => {
  return transactionsUsingAccounts(s.ui.selectedAccounts, Object.values(s.entities.transactions));
};

export const rootAccountSelector = (s: ReduxAppState) => {
  return s.ui.rootAccount;
};

export class AppStateActions {
  static readonly ADD_TRANSACTIONS = 'ADD_TRANSACTIONS';
  static readonly SET_EDITED_TRANSACTION = 'SET_EDITED_TRANSACTION';
  static readonly SELECT_ACCOUNT = 'SELECT_ACCOUNT';
  static readonly DELETE_TRANSACTION = 'DELETE_TRANSACTION';
  static readonly UPDATE_TRANSACTION = 'UPDATE_TRANSACTION';
  static readonly OPEN_LEFT_PANEL = 'OPEN_LEFT_PANEL';
  static readonly TOGGLE_LEFT_PANEL = 'TOGGLE_LEFT_PANEL';
  static readonly OPEN_TRANSACTION_PANEL = 'OPEN_TRANSACTION_PANEL';
  static readonly SET_IS_LOADING = 'SET_IS_LOADING';

  static setEditedTransaction(id: string | undefined): AnyAction {
    return {
      uuid: id,
      type: AppStateActions.SET_EDITED_TRANSACTION,
    };
  }

  static selectAccount(account: string, isSelected: boolean): AnyAction {
    return {
      account,
      isSelected,
      type: AppStateActions.SELECT_ACCOUNT,
    };
  }

  static addTransactions(transactions: Transaction[], clearOldTransactions: boolean = false): AnyAction {
    return {
      transactions,
      clearOldTransactions,
      type: AppStateActions.ADD_TRANSACTIONS,
    };
  }

  static deleteTransaction(id: string): AnyAction {
    return {
      id,
      type: AppStateActions.DELETE_TRANSACTION,
    };
  }

  static updateTransaction(transaction: TransactionWithUUID): AnyAction {
    return {
      transaction,
      type: AppStateActions.UPDATE_TRANSACTION,
    };
  }

  static openLeftPanel(open: boolean): AnyAction {
    return {
      open,
      type: AppStateActions.OPEN_LEFT_PANEL,
    };
  }

  static toggleLeftPanel(): AnyAction {
    return {
      type: AppStateActions.TOGGLE_LEFT_PANEL,
    };
  }

  static openTransactionPanel(open: boolean): AnyAction {
    return {
      open,
      type: AppStateActions.OPEN_TRANSACTION_PANEL,
    };
  }

  static setIsLoading(isLoading: boolean): AnyAction {
    return {
      isLoading,
      type: AppStateActions.SET_IS_LOADING,
    };
  }
}

const concatReducer = (prev: [any], curr: [any]) => ([...prev, ...curr]);
const unionReducer = (prev: [any], curr: [any]) => ([...prev, ...curr.filter(x => !prev.includes(x))]);
const differenceReducer = (prev: [any], curr: [any]) => ([...prev.filter(x => !curr.includes(x))]);

const specialCase = (newlySelectedAccounts, allAccounts): string[] => {
  if (newlySelectedAccounts.length === 1 && newlySelectedAccounts.includes(ROOT_ACCOUNT)) {
    return [];
  }

  if (newlySelectedAccounts.length === allAccounts.length - 1 && !newlySelectedAccounts.includes(ROOT_ACCOUNT)) {
    return [ROOT_ACCOUNT, ...newlySelectedAccounts];
  }

  return newlySelectedAccounts;
};

const addOrUpdateTransactions = (previous: TransactionMap, transactions: TransactionWithUUID[], clearOldTransactions: boolean)
: TransactionMap => {
  const withAmounts = transactions
  .map(t => addMissingAmount(t))
  .reduce<TransactionMap>( (prev, curr) => ({...prev, [curr.uuid]: curr}), {});

  return {
    ...clearOldTransactions ? {} : previous,
    ...withAmounts,
  };
};

const addMissingAmount = (transaction: TransactionWithUUID): TransactionWithUUID => {
  const result = transaction.postings.reduce<{withAmount: Posting[], withoutAmount: Posting[], sum: Decimal}>( (prev, posting) => {
      if (posting.amount === null || posting.amount === undefined) {
        return {...prev, withoutAmount: [...prev.withoutAmount, posting] };
      } else {
        return {...prev, withAmount: [...prev.withAmount, posting], sum: Decimal.add(prev.sum, posting.amount) };
      }
    }, {withAmount: [], withoutAmount: [], sum: new Decimal(0)});

  // If more than one account is missing amount, we don't know of to split the transaction...
  if (result.withoutAmount.length !== 1) { return transaction; }

  return {
    ...transaction,
    postings: [...result.withAmount, { ...result.withoutAmount[0], amount: new Decimal(-result.sum) }],
  };
};

const generateAccounts = (transactions: Transaction[]): AccountMap => {
  const accounts = createAccountsFromTransactions(transactions);
  const topAccounts = accounts.filter(a => a.parents.length === 0);
  const root = new ReduxAccount(ROOT_ACCOUNT);
  root.children = topAccounts.map(a => a.name);
  root.childrenBalance = topAccounts
    .map(a => a.childrenBalance.plus(a.balance) )
    .reduce( (b1, b2) => b1.plus(b2), new Decimal(0));

  return [
    root,
    ...accounts,
  ].reduce<AccountMap>( (prev, curr) => ({...prev, [curr.name]: curr}), {});
};

const createAccountsFromTransactions = (transactions: Transaction[]): ReduxAccount[] => {
  const flatAccounts = new Map();

    transactions.forEach(tr => {
        tr.postings.forEach(ps => {
            const accountParts = ps.account.split(':');
            let lastParent: ReduxAccount | undefined;
            let currentAccountName = '';
            for (const part of accountParts) {
                currentAccountName += part;
                const account = getOrCreateAccount(currentAccountName, lastParent, flatAccounts);
                addAmountToAccount(account, ps.amount || new Decimal(0), currentAccountName === ps.account);

                if (lastParent) {
                    lastParent.children = [lastParent.children, [account.name]].reduce(unionReducer);
                }

                lastParent = account;
                currentAccountName += ':';
            }
        });
    });

    return Array.from(flatAccounts.values());
};

const getOrCreateAccount = (name: string, parent: ReduxAccount | undefined, accountsMap: Map<string, ReduxAccount>): ReduxAccount => {
  let stat = accountsMap.get(name);

  if (!stat) {
      stat = new ReduxAccount(name);
      stat.parents = parent ? [parent.name] : [];
      accountsMap.set(name, stat);
  }

  return stat;
};

const addAmountToAccount = (a: ReduxAccount, amount: Decimal, isFinalAccount: boolean) => {
  if (!isFinalAccount) {
      a.childrenBalance = a.childrenBalance.plus(amount);
      a.nbChildrenTransactions ++;
      if (amount.greaterThan(0)) {
          a.childrenCredits = a.childrenCredits.plus(amount);
      } else {
          a.childrenDebits = a.childrenDebits.plus(amount);
      }
  } else {
      a.balance = a.balance.plus(amount);
      a.nbTransactions++;

      if (amount.greaterThan(0)) {
        a.credits = a.credits.plus(amount);
      } else {
          a.debits = a.debits.plus(amount);
      }
  }
};


/******************************************************/
const setEditedTransaction = (state: ReduxAppState, id: string): ReduxAppState => {
  return {
    ...state,
    ui: {
      ...state.ui,
      isTransactionPanelOpen: id ? true : false,
      editedTransaction: id,
    },
  };
};

const allChildren = (state: ReduxAppState, a: string): string[] => {
  const account = state.entities.accounts[a];
  const children = account.children.map(c => allChildren(state, c)).reduce(concatReducer, []);

  return [a, ...children];
};

const selectAccounts = (state: ReduxAppState, shouldSelect: boolean, accounts: string[]): ReduxAppState => {
  const accountsAlreadySelected = state.ui.selectedAccounts;

  const accountsWithChildren = accounts
  .map(a => allChildren(state, a))
  .reduce(unionReducer, []);

  const newlySelectedAccounts = [accountsAlreadySelected, accountsWithChildren].reduce(shouldSelect ? unionReducer : differenceReducer);
  const acc = specialCase(newlySelectedAccounts, Object.keys(state.entities.accounts));

  console.log(acc);

  return {
        ...state,
        ui: {
          ...state.ui,
          selectedAccounts: acc,
        },
      };
};

const addTransactions = (state: ReduxAppState, transactions: Transaction[], clearOldTransactions: boolean): ReduxAppState => {
  const transactionsWithUuid = transactions.map(t => ({
    ...t,
    uuid: uuid(),
  }));

  const tr = addOrUpdateTransactions(state.entities.transactions, transactionsWithUuid, clearOldTransactions);
  return stateWithNewTransactions(state, tr);
};

const deleteTransaction = (state: ReduxAppState, id: string): ReduxAppState => {
  const tr = Object.entries(state.entities.transactions)
  .filter( e => e[0] !== id)
  .reduce<TransactionMap>( (prev, curr) => ({...prev, [curr[0]]: curr[1]}), {});

  return stateWithNewTransactions(state, tr);
};

const updateTransaction = (state: ReduxAppState, transaction: TransactionWithUUID): ReduxAppState => {
  const tr = {
    ...state.entities.transactions,
    [transaction.uuid]: transaction,
  };

  return stateWithNewTransactions(state, tr);
};

const openLeftPanel = (state: ReduxAppState, open: boolean): ReduxAppState => {
  return {
    ...state,
    ui: {
      ...state.ui,
      isLeftMenuOpen: open,
    },
  };
};

const toggleLeftPanel = (state: ReduxAppState): ReduxAppState => {
  return openLeftPanel(state, !state.ui.isLeftMenuOpen);
};

const openTransactionPanel = (state: ReduxAppState, open: boolean): ReduxAppState => {
  return {
    ...state,
    ui: {
      ...state.ui,
      isTransactionPanelOpen: open,
    },
  };
};

const setIsLoading = (state: ReduxAppState, isLoading: boolean): ReduxAppState => {
  return {
    ...state,
    ui: {
      ...state.ui,
      isLoading,
    },
  };
};


const stateWithNewTransactions = (state: ReduxAppState, transactions: TransactionMap): ReduxAppState => {
  const ac = generateAccounts(Object.values(transactions));
  const sa = [state.ui.selectedAccounts, Object.keys(ac)].reduce(unionReducer);

  return {
    ...state,
    entities: {
      transactions,
      accounts: ac,
    },
    ui: {
      ...state.ui,
    },
  };
};

export function rootReducer(lastState: ReduxAppState= INITIAL_STATE, action: AnyAction): ReduxAppState {
  switch (action.type) {
    case AppStateActions.SET_EDITED_TRANSACTION:
      console.log('SET_EDITED_TRANSACTION');
      return setEditedTransaction(lastState, action.uuid);

    case AppStateActions.SELECT_ACCOUNT:
      console.log('SELECT_ACCOUNT');
      return selectAccounts(lastState, action.isSelected, [action.account]);

    case AppStateActions.ADD_TRANSACTIONS:
      console.log('ADD_TRANSACTIONS');
      return addTransactions(lastState, action.transactions, action.clearOldTransactions);

    case AppStateActions.DELETE_TRANSACTION:
      console.log('DELETE_TRANSACTION');
      return deleteTransaction(lastState, action.id);

    case AppStateActions.UPDATE_TRANSACTION:
      console.log('UPDATE_TRANSACTION');
      return updateTransaction(lastState, action.transaction);

    case AppStateActions.OPEN_LEFT_PANEL:
      console.log('OPEN_LEFT_PANEL');
      return openLeftPanel(lastState, action.open);

    case AppStateActions.TOGGLE_LEFT_PANEL:
      console.log('TOGGLE_LEFT_PANEL');
      return toggleLeftPanel(lastState);

    case AppStateActions.OPEN_TRANSACTION_PANEL:
      console.log('OPEN_TRANSACTION_PANEL');
      return openTransactionPanel(lastState, action.open);

    case AppStateActions.SET_IS_LOADING:
      console.log('SET_IS_LOADING');
      return setIsLoading(lastState, action.isLoading);
  }

  return lastState;
}

