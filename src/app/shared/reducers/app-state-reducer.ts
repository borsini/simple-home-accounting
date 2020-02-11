import {v4 as uuid } from 'uuid';
import Decimal from 'decimal.js';

import { AppState, TransactionMap, AccountMap, Tab, Tabs, Ui, Filters, Entities, Computed } from './../models/app-state';
import { Account } from '../models/account';
import { Action, AnyAction } from 'redux';
import { Transaction, TransactionWithUUID, isTransactionWithUUID } from '../models/transaction';
import { Posting } from '../models/posting';
import { unionReducer, concatReducer, differenceReducer, intersectionReducer } from '../utils/utils';
import { filtersSelector } from '../selectors/selectors';

export const ROOT_ACCOUNT = 'ROOT';

export const INITIAL_STATE: AppState = {
  entities: {
    transactions: {},
  },
  computed: {
    accounts: { ROOT_ACCOUNT: new Account(ROOT_ACCOUNT) },
    invalidTransactions: [],
  },
  ui: {
    tabs: {
      [ROOT_ACCOUNT]: {
        id: ROOT_ACCOUNT,
        selectedAccounts: [ROOT_ACCOUNT],
        editedTransaction: undefined,
        filters: {
          input: '',
          showOnlyInvalid: false,
          minDate: undefined,
          maxDate: undefined,
          tags: [],
        },
        isClosable: false,
      },
    },
    isLeftMenuOpen: false,
    persistedAt: undefined,
    isLoading: false,
  },
};

export class AppStateActions {
  static readonly ADD_TRANSACTIONS = 'ADD_TRANSACTIONS';
  static readonly SET_EDITED_TRANSACTION = 'SET_EDITED_TRANSACTION';
  static readonly DELETE_TRANSACTION = 'DELETE_TRANSACTION';
  static readonly UPDATE_TRANSACTION = 'UPDATE_TRANSACTION';
  static readonly SET_IS_LOADING = 'SET_IS_LOADING';
  static readonly SET_INPUT_FILTER = 'SET_INPUT_FILTER';
  static readonly SHOW_ONLY_INVALID = 'SHOW_ONLY_INVALID';
  static readonly SET_MIN_DATE = 'SET_MIN_DATE';
  static readonly SET_MAX_DATE = 'SET_MAX_DATE';
  static readonly SET_TAGS = 'SET_TAGS';
  static readonly OPEN_TAB = 'OPEN_TAB';
  static readonly CLOSE_TAB = 'CLOSE_TAB';

  static setEditedTransaction(t: Transaction | TransactionWithUUID | undefined, tab: string): AnyAction {
    return {
      transaction: t,
      type: AppStateActions.SET_EDITED_TRANSACTION,
      tab,
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

  static setIsLoading(isLoading: boolean): AnyAction {
    return {
      isLoading,
      type: AppStateActions.SET_IS_LOADING,
    };
  }

  static setInputFilter(input: string, tab: string): AnyAction {
    return {
      input,
      type: AppStateActions.SET_INPUT_FILTER,
      tab,
    };
  }

  static showOnlyInvalid(show: boolean, tab: string): AnyAction {
    return {
      show,
      type: AppStateActions.SHOW_ONLY_INVALID,
      tab,
    };
  }

  static setMinDate(date: number | undefined, tab: string): AnyAction {
    return {
      date,
      type: AppStateActions.SET_MIN_DATE,
      tab,
    };
  }

  static setMaxDate(date: number | undefined, tab: string): AnyAction {
    return {
      date,
      type: AppStateActions.SET_MAX_DATE,
      tab,
    };
  }

  static setTags(tags: string[], tab: string): AnyAction {
    return {
      tags,
      type: AppStateActions.SET_TAGS,
      tab,
    };
  }

  static openTab(accounts: string[]): AnyAction {
    return {
      accounts,
      open,
      type: AppStateActions.OPEN_TAB,
    };
  }

  static closeTab(tab: string): AnyAction {
    return {
      tab,
      type: AppStateActions.CLOSE_TAB,
    };
  }
}

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
      if (!posting.amount) {
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

const addRootToAccounts = (accounts: Account[]): Account[] => {
  //Create root account as parent of all top accounts
  const topAccounts = accounts.filter(a => a.parent === undefined);
  const root = new Account(ROOT_ACCOUNT);
  root.children = topAccounts.map(a => a.name);
  root.childrenBalance = topAccounts
    .map(a => a.childrenBalance.plus(a.balance) )
    .reduce( (b1, b2) => b1.plus(b2), new Decimal(0));
  topAccounts.forEach(ta => ta.parent = root.name);

  return [
    root,
    ...accounts,
  ];
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
  let account = accountsMap.get(name);

  if (!account) {
    account = new Account(name);
    account.parent = parent ? parent.name : undefined;
      accountsMap.set(name, account);
  }

  return account;
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
const setEditedTransaction = (state: AppState, t: Transaction | TransactionWithUUID | undefined, tab: string): AppState => {
  return {
    ...state,
    ui: {
      ...state.ui,
      tabs: {
        ...state.ui.tabs,
        [tab]: {
          ...state.ui.tabs[tab],
          editedTransaction: t,
        },
      },
    },
  };
};

const addTransactions = (state: AppState, transactions: Transaction[], clearOldTransactions: boolean): AppState => {
  //Create Entities
  const transactionsWithUuid = transactions.map(t => ({...t,uuid: uuid()})).map(t => addMissingAmount(t));
  const newTransactions = addOrUpdateTransactions(state.entities.transactions, transactionsWithUuid, clearOldTransactions);
  const entities: Entities = {transactions : newTransactions}
  
  //Create Computed
  const newAccounts = addTransactionsToAccounts(clearOldTransactions ? [] : Object.values(state.computed.accounts),transactionsWithUuid)
    .reduce<AccountMap>( (prev, curr) => ({...prev, [curr.name]: curr}), {});

  const newInvalidTransactions = transactionsWithUuid.filter(t =>
    t.header.title === undefined ||
    t.postings.length < 2).map(t2 => t2.uuid);

  const computed: Computed = {
    accounts: newAccounts,
    invalidTransactions: newInvalidTransactions
  }

  //Create Ui
  const ui = updateUi(state.ui, Object.keys(entities.transactions), Object.keys(newAccounts));

  return {
    entities,
    computed,
    ui
  }
};

const addTransactionsToAccounts = (existingAccounts: Account[], transactions: Transaction[]): Account[] =>  {
  const newAccounts = addRootToAccounts(createAccountsFromTransactions(transactions))

  const allAccounts = newAccounts.concat(existingAccounts)

  return [existingAccounts.map(a => a.name), newAccounts.map(a => a.name)]
    .reduce(unionReducer)
    .map(name => allAccounts.filter(a => a.name == name).reduce((prev, curr) => prev.plus(curr)))
};

const deleteTransaction = (state: AppState, id: string): AppState => {
  //Create Entities
  const transactionDeleted = state.entities.transactions[id];
  const newTransactions = Object.assign({}, state.entities.transactions);
  delete newTransactions[id];

  const entities: Entities = {transactions : newTransactions}
  
  //Create Computed
  const newAccounts = deleteTransactionsFromAccounts(Object.values(state.computed.accounts), [transactionDeleted])
    .reduce<AccountMap>( (prev, curr) => ({...prev, [curr.name]: curr}), {});

  const computed: Computed = {
    ...state.computed,
    accounts: newAccounts
  }

  //Create Ui
  const ui = updateUi(state.ui, Object.keys(newTransactions), Object.keys(newAccounts));

  return {
    entities,
    computed,
    ui
  }
};

const deleteTransactionsFromAccounts = (existingAccounts: Account[], transactions: Transaction[]): Account[] =>  {
  const accountsToSubstract = addRootToAccounts(createAccountsFromTransactions(transactions))

  const allAccounts = existingAccounts.concat(accountsToSubstract)

  const allAccountsWithValuesUpdated = [existingAccounts.map(a => a.name), accountsToSubstract.map(a => a.name)]
    .reduce(unionReducer)
    .map(name => allAccounts.filter(a => a.name == name).reduce((prev, curr) => prev.minus(curr)))
  
    var accountsToDelete = allAccountsWithValuesUpdated.filter(isAccountEmpty).map(a => a.name)
    var finalAccounts: Account[] = []
    do {
      finalAccounts = deleteAccounts(accountsToDelete, allAccountsWithValuesUpdated)
      accountsToDelete = finalAccounts.filter(isAccountEmpty).map(a => a.name)
    } while(accountsToDelete.length > 0)
    
    return finalAccounts;
};

const isAccountEmpty = (a :Account): Boolean => {
  return a.name != "ROOT" && a.nbTransactions == 0 && a.nbChildrenTransactions == 0 && a.children.length == 0
}

const deleteAccounts = (names: string[], accounts: Account[]): Account[] => {
  const remainingAccounts = accounts.filter(a => names.indexOf(a.name) <= -1)
  remainingAccounts.forEach(a => { a.children = [a.children, names].reduce(differenceReducer) })
  return remainingAccounts;
}

const updateTransactions = (state: AppState, transactions: [TransactionWithUUID]): AppState => {
  //Create Entities
  const transactionsWithUuid = transactions.map(t => addMissingAmount(t));
  const newTransactions = addOrUpdateTransactions(state.entities.transactions, transactionsWithUuid, false);
  const entities: Entities = {transactions : newTransactions}
  
  //Create Computed
  const existingAccounts = Object.values(state.computed.accounts)
  const newAccounts = addTransactionsToAccounts(deleteTransactionsFromAccounts(existingAccounts, transactionsWithUuid) ,transactionsWithUuid)
    .reduce<AccountMap>( (prev, curr) => ({...prev, [curr.name]: curr}), {});

  const newInvalidTransactions = transactionsWithUuid.filter(t =>
    t.header.title === undefined ||
    t.postings.length < 2).map(t2 => t2.uuid);

  const computed: Computed = {
    accounts: newAccounts,
    invalidTransactions: newInvalidTransactions
  }

  //Create Ui
  const ui = updateUi(state.ui, Object.keys(entities.transactions), Object.keys(newAccounts));

  return {
    entities,
    computed,
    ui
  }
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

const setInputFilter = (state: AppState, input: string, tab: string): AppState => {
  const f = { ...filtersSelector(tab)(state), input };
  return stateWithFilters(state, f, tab);
};

const showOnlyInvalid = (state: AppState, show: boolean, tab: string): AppState => {
  const f = { ...filtersSelector(tab)(state), showOnlyInvalid: show };
  return stateWithFilters(state, f, tab);
};


const setMinDate = (state: AppState, date: number | undefined, tab: string): AppState => {
  const f = { ...filtersSelector(tab)(state), minDate: date };
  return stateWithFilters(state, f, tab);
};


const stateWithFilters = (state: AppState, filters: Filters, tab: string): AppState => {
  return {
    ...state,
    ui: {
      ...state.ui,
      tabs: {
        ...state.ui.tabs,
        [tab]: {
          ...state.ui.tabs[tab],
          filters,
        },
      },
    },
  };
};


const setMaxDate = (state: AppState, date: number | undefined, tab: string): AppState => {
  const f = { ...filtersSelector(tab)(state), maxDate: date };
  return stateWithFilters(state, f, tab);
};

const setTags = (state: AppState, tags: string[], tab: string): AppState => {
  const f = { ...filtersSelector(tab)(state), tags };
  return stateWithFilters(state, f, tab);
};

const isTabAlreadyOpen = (currentTabs: Tabs, accounts: string[]) => {
  return Object.values(currentTabs).some(t => [t.selectedAccounts, accounts].reduce(differenceReducer).length === 0);
};

const stateWithNewTabs = (state: AppState, newTabs: Tabs): AppState => {
  return {
    ...state,
    ui: {
      ...state.ui,
      tabs: newTabs,
    },
  };
};

const closeTab = (state: AppState, tab: string): AppState => {
  const newTabs = Object.values(state.ui.tabs)
    .filter(t => t.id !== tab)
    .reduce<Tabs>( (prev, curr) => ({ ...prev,  [curr.id]: curr}), {});
  return stateWithNewTabs(state, newTabs);
};

const createTab = (selectedAccounts: string[]): Tab => ({
  id: uuid(),
  selectedAccounts,
  filters: {
    input: '',
    showOnlyInvalid: false,
    tags: [],
  },
  isClosable: true,
});

const openTab = (state: AppState, accounts: string[]): AppState => {
  const currentTabs = state.ui.tabs;
  if (isTabAlreadyOpen(currentTabs, accounts)) {
    return state;
  } else {
    const tab = createTab(accounts);
    const newTabs = { ...currentTabs, [tab.id]: tab} ;
    return stateWithNewTabs(state, newTabs);
  }
};

const updateTab = (tab: Tab, newAccounts: string[], newTransactions: string[]): Tab | null => {
  const selectedAccounts = [tab.selectedAccounts, newAccounts].reduce(intersectionReducer);

  if (selectedAccounts.length === 0) { return null; }

  const editedTransaction =
  (isTransactionWithUUID(tab.editedTransaction) && newTransactions.includes(tab.editedTransaction.uuid)) ||
  !isTransactionWithUUID(tab.editedTransaction)
  ? tab.editedTransaction
  : undefined;

  return {
    ...tab,
    selectedAccounts,
    editedTransaction,
  };
};

const updateUi = (ui: Ui, newTransactions: string[], newAccounts: string[]): Ui => {
  const tabs = Object.keys(ui.tabs).reduce<Tabs>( (prev, tabId) => {
    const tab = updateTab(ui.tabs[tabId], newAccounts, newTransactions);
    return tab ? { ...prev, [tab.id]: tab } : prev;
  }, {});

  return {
    ...ui,
    tabs,
  };
};

export function rootReducer(lastState: AppState= INITIAL_STATE, action: AnyAction): AppState {
  switch (action.type) {
    case AppStateActions.SET_EDITED_TRANSACTION:
      return setEditedTransaction(lastState, action.transaction, action.tab);

    case AppStateActions.ADD_TRANSACTIONS:
      return addTransactions(lastState, action.transactions, action.clearOldTransactions);

    case AppStateActions.DELETE_TRANSACTION:
      return deleteTransaction(lastState, action.id);

    case AppStateActions.UPDATE_TRANSACTION:
      return updateTransactions(lastState, [action.transaction]);

    case AppStateActions.SET_IS_LOADING:
      return setIsLoading(lastState, action.isLoading);

    case AppStateActions.SET_INPUT_FILTER:
      return setInputFilter(lastState, action.input, action.tab);

    case AppStateActions.SHOW_ONLY_INVALID:
      return showOnlyInvalid(lastState, action.show, action.tab);

    case AppStateActions.SET_MIN_DATE:
      return setMinDate(lastState, action.date, action.tab);

    case AppStateActions.SET_MAX_DATE:
      return setMaxDate(lastState, action.date, action.tab);

    case AppStateActions.SET_TAGS:
      return setTags(lastState, action.tags, action.tab);

    case AppStateActions.OPEN_TAB:
      return openTab(lastState, action.accounts);

    case AppStateActions.CLOSE_TAB:
      return closeTab(lastState, action.tab);
  }

  return lastState;
}

