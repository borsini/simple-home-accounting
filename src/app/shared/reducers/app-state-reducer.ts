import {v4 as uuid } from 'uuid';
import Decimal from 'decimal.js';

import { AppState, TransactionMap, AccountMap } from './../models/app-state';
import { Account } from '../models/account';
import { Action, AnyAction } from 'redux';
import { Transaction, TransactionWithUUID, isTransactionWithUUID } from '../models/transaction';
import { Posting } from '../models/posting';

const ROOT_ACCOUNT = 'ROOT';

export const INITIAL_STATE: AppState = {
  entities: {
    transactions: {},
  },
  computed: {
    accounts: { ROOT_ACCOUNT: new Account(ROOT_ACCOUNT) },
    invalidTransactions: [],
  },
  ui: {
    selectedAccounts: [],
    rootAccount: ROOT_ACCOUNT,
    editedTransaction: undefined,
    isLeftMenuOpen: false,
    persistedAt: undefined,
    isLoading: false,
    filters: {
      input: '',
      showOnlyInvalid: false,
    },
  },
};

export const selectEditedTransaction = (s: AppState) => {
  return s.ui.editedTransaction;
};

export const allTransactionsSelector = (s: AppState) => {
  return s.entities.transactions;
};

export const allAccountsSelector = (s: AppState) => {
  return s.computed.accounts;
};

export const isLeftMenuOpenSelector = (s: AppState) => {
  return s.ui.isLeftMenuOpen;
};

export const isTransactionPanelOpenSelector = (s: AppState) => {
  return s.ui.editedTransaction !== undefined;
};

export const isLoadingSelector = (s: AppState) => {
  return s.ui.isLoading;
};

export const selectedAccountsSelector = (s: AppState) => {
  return s.ui.selectedAccounts;
};

export const canAutosearchSelector = (s: AppState) => {
  return !s.ui.isLeftMenuOpen && !isTransactionPanelOpenSelector(s);
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

export const selectedTransactionsSelector = (s: AppState) => {
  return transactionsUsingAccounts(s.ui.selectedAccounts, Object.values(s.entities.transactions));
};

export const rootAccountSelector = (s: AppState) => {
  return s.ui.rootAccount;
};

export const invalidTransactionsSelector = (s: AppState) => {
  return s.computed.invalidTransactions;
};

export const filtersSelector = (s: AppState) => {
  return s.ui.filters;
};

export class AppStateActions {
  static readonly ADD_TRANSACTIONS = 'ADD_TRANSACTIONS';
  static readonly SET_EDITED_TRANSACTION = 'SET_EDITED_TRANSACTION';
  static readonly SELECT_ACCOUNT = 'SELECT_ACCOUNT';
  static readonly DELETE_TRANSACTION = 'DELETE_TRANSACTION';
  static readonly UPDATE_TRANSACTION = 'UPDATE_TRANSACTION';
  static readonly OPEN_LEFT_PANEL = 'OPEN_LEFT_PANEL';
  static readonly TOGGLE_LEFT_PANEL = 'TOGGLE_LEFT_PANEL';
  static readonly SET_IS_LOADING = 'SET_IS_LOADING';
  static readonly SET_INPUT_FILTER = 'SET_INPUT_FILTER';
  static readonly SHOW_ONLY_INVALID = 'SHOW_ONLY_INVALID';

  static setEditedTransaction(t: Transaction | TransactionWithUUID | undefined): AnyAction {
    return {
      transaction: t,
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

  static setIsLoading(isLoading: boolean): AnyAction {
    return {
      isLoading,
      type: AppStateActions.SET_IS_LOADING,
    };
  }

  static setInputFilter(input: string): AnyAction {
    return {
      input,
      type: AppStateActions.SET_INPUT_FILTER,
    };
  }

  static showOnlyInvalid(show: boolean): AnyAction {
    return {
      show,
      type: AppStateActions.SHOW_ONLY_INVALID,
    };
  }
}

export const concatReducer = (prev: any[], curr: any[]) => ([...prev, ...curr]);
export const unionReducer = (prev: any[], curr: any[]) => ([...prev, ...curr.filter(x => !prev.includes(x))]);
export const differenceReducer = (prev: any[], curr: any[]) => ([...prev.filter(x => !curr.includes(x))]);
export const intersectionReducer = (prev: any[], curr: any[]) => (prev.filter(x => curr.indexOf(x) !== -1));

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
  const withAmounts = {};
  transactions
  .map(t => addMissingAmount(t))
  .forEach(m => withAmounts[m.uuid] = m);

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
    postings: [...result.withAmount, { ...result.withoutAmount[0], amount: new Decimal(-result.sum).toString() }],
  };
};

const generateAccounts = (transactions: Transaction[]): AccountMap => {
  const accounts = createAccountsFromTransactions(transactions);
  const topAccounts = accounts.filter(a => a.parents.length === 0);
  const root = new Account(ROOT_ACCOUNT);
  root.children = topAccounts.map(a => a.name);
  root.childrenBalance = topAccounts
    .map(a => a.childrenBalance.plus(a.balance) )
    .reduce( (b1, b2) => b1.plus(b2), new Decimal(0));

  return [
    root,
    ...accounts,
  ].reduce<AccountMap>( (prev, curr) => ({...prev, [curr.name]: curr}), {});
};

const createAccountsFromTransactions = (transactions: Transaction[]): Account[] => {
  const flatAccounts = new Map();

    transactions.forEach(tr => {
        tr.postings.forEach(ps => {
            const accountParts = ps.account.split(':');
            let lastParent: Account | undefined;
            let currentAccountName = '';
            for (const part of accountParts) {
                currentAccountName += part;
                const account = getOrCreateAccount(currentAccountName, lastParent, flatAccounts);
                addAmountToAccount(account, ps.amount || '0', currentAccountName === ps.account);

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

const getOrCreateAccount = (name: string, parent: Account | undefined, accountsMap: Map<string, Account>): Account => {
  let stat = accountsMap.get(name);

  if (!stat) {
      stat = new Account(name);
      stat.parents = parent ? [parent.name] : [];
      accountsMap.set(name, stat);
  }

  return stat;
};

const addAmountToAccount = (a: Account, amount: string, isFinalAccount: boolean) => {
  const decimalAmount = new Decimal(amount);

  if (!isFinalAccount) {
      a.childrenBalance = a.childrenBalance.plus(amount);
      a.nbChildrenTransactions ++;
      if (decimalAmount.greaterThan(0)) {
          a.childrenCredits = a.childrenCredits.plus(amount);
      } else {
          a.childrenDebits = a.childrenDebits.plus(amount);
      }
  } else {
      a.balance = a.balance.plus(amount);
      a.nbTransactions++;

      if (decimalAmount.greaterThan(0)) {
        a.credits = a.credits.plus(amount);
      } else {
          a.debits = a.debits.plus(amount);
      }
  }
};


/******************************************************/
const setEditedTransaction = (state: AppState, t: Transaction | TransactionWithUUID | undefined): AppState => {
  return {
    ...state,
    ui: {
      ...state.ui,
      editedTransaction: t,
    },
  };
};

const allChildren = (state: AppState, a: string): string[] => {
  const account = state.computed.accounts[a];
  const children = account.children.map(c => allChildren(state, c)).reduce(concatReducer, []);

  return [a, ...children];
};

const selectAccounts = (state: AppState, shouldSelect: boolean, accounts: string[]): AppState => {
  const accountsAlreadySelected = state.ui.selectedAccounts;

  const accountsWithChildren = accounts
  .map(a => allChildren(state, a))
  .reduce(unionReducer, []);

  const newlySelectedAccounts = [accountsAlreadySelected, accountsWithChildren].reduce(shouldSelect ? unionReducer : differenceReducer);
  const acc = specialCase(newlySelectedAccounts, Object.keys(state.computed.accounts));

  return {
        ...state,
        ui: {
          ...state.ui,
          selectedAccounts: acc,
        },
      };
};

const addTransactions = (state: AppState, transactions: Transaction[], clearOldTransactions: boolean): AppState => {
  const transactionsWithUuid = transactions.map(t => ({
    ...t,
    uuid: uuid(),
  }));

  const tr = addOrUpdateTransactions(state.entities.transactions, transactionsWithUuid, clearOldTransactions);
  return stateWithNewTransactions(state, tr);
};

const deleteTransaction = (state: AppState, id: string): AppState => {
  const tr = Object.assign({}, state.entities.transactions);
  delete tr[id];

  return stateWithNewTransactions(state, tr);
};

const updateTransaction = (state: AppState, transaction: TransactionWithUUID): AppState => {
  const tr = {
    ...state.entities.transactions,
    [transaction.uuid]: transaction,
  };

  return stateWithNewTransactions(state, tr);
};

const openLeftPanel = (state: AppState, open: boolean): AppState => {
  return {
    ...state,
    ui: {
      ...state.ui,
      isLeftMenuOpen: open,
    },
  };
};

const toggleLeftPanel = (state: AppState): AppState => {
  return openLeftPanel(state, !state.ui.isLeftMenuOpen);
};

const setIsLoading = (state: AppState, isLoading: boolean): AppState => {
  return {
    ...state,
    ui: {
      ...state.ui,
      isLoading,
    },
  };
};

const setInputFilter = (state: AppState, input: string): AppState => {
  return {
    ...state,
    ui: {
      ...state.ui,
      filters: {
        ...state.ui.filters,
        input,
      },
    },
  };
};

const showOnlyInvalid = (state: AppState, show: boolean): AppState => {
  return {
    ...state,
    ui: {
      ...state.ui,
      filters: {
        ...state.ui.filters,
        showOnlyInvalid: show,
      },
    },
  };
};

const stateWithNewTransactions = (state: AppState, transactionMap: TransactionMap): AppState => {
  const transactions = Object.values(transactionMap);
  const newAccounts = generateAccounts(transactions);
  const newAccountsKeys = Object.keys(newAccounts);
  const previouslySelected = state.ui.selectedAccounts;

  // Unselect accounts if they dont exist anymore
  const newSelectedAccounts = previouslySelected.length === 0
  ? newAccountsKeys
  : [previouslySelected, newAccountsKeys].reduce(intersectionReducer);

  // Unselect transaction if it doesnt exist anymore
  const previouslyEdited = state.ui.editedTransaction;
  const newEdited = isTransactionWithUUID(previouslyEdited)
  && transactions.includes(previouslyEdited) ? previouslyEdited : undefined;

  // Check if transactions are valid
  const newInvalidTransactions = transactions.filter(t =>
    t.header.title === undefined ||
    t.postings.length < 2).map(t2 => t2.uuid);

  return {
    ...state,
    entities: {
      transactions: transactionMap,
    },
    computed: {
      accounts: newAccounts,
      invalidTransactions: newInvalidTransactions,
    },
    ui: {
      ...state.ui,
      selectedAccounts: newSelectedAccounts,
      editedTransaction: newEdited,
    },
  };
};

export function rootReducer(lastState: AppState= INITIAL_STATE, action: AnyAction): AppState {
  switch (action.type) {
    case AppStateActions.SET_EDITED_TRANSACTION:
      return setEditedTransaction(lastState, action.transaction);

    case AppStateActions.SELECT_ACCOUNT:
      return selectAccounts(lastState, action.isSelected, [action.account]);

    case AppStateActions.ADD_TRANSACTIONS:
      return addTransactions(lastState, action.transactions, action.clearOldTransactions);

    case AppStateActions.DELETE_TRANSACTION:
      return deleteTransaction(lastState, action.id);

    case AppStateActions.UPDATE_TRANSACTION:
      return updateTransaction(lastState, action.transaction);

    case AppStateActions.OPEN_LEFT_PANEL:
      return openLeftPanel(lastState, action.open);

    case AppStateActions.TOGGLE_LEFT_PANEL:
      return toggleLeftPanel(lastState);

    case AppStateActions.SET_IS_LOADING:
      return setIsLoading(lastState, action.isLoading);

    case AppStateActions.SET_INPUT_FILTER:
      return setInputFilter(lastState, action.input);

    case AppStateActions.SHOW_ONLY_INVALID:
      return showOnlyInvalid(lastState, action.show);
  }

  return lastState;
}

