import { AppState, Tab, Tabs, AccountMap } from '../models/app-state';
import { TransactionWithUUID } from '../models/transaction';
import { Account } from '../models/account';
import { ROOT_ACCOUNT } from '../reducers/app-state-reducer';
import { intersectionReducer } from '../utils/utils';

/* Selectors */

const tabSelector = (s: AppState, tab: string): Tab => {
    return s.ui.tabs[tab];
  };

  export const editedTransactionSelector = (tab: string) => (s: AppState) => {
    return tabSelector(s, tab).editedTransaction;
  };

  export const allTransactionsSelector = (s: AppState) => {
    return s.entities.transactions;
  };

  export const allAccountsSelector = (s: AppState) => {
    return s.computed.accounts;
  };

  const getAncestors = (allAccounts: AccountMap, accountId: string): Account[] => {
    const account = allAccounts[accountId];

    if(account && account.parent) {
      return [account, ...getAncestors(allAccounts, account.parent)];
    }

    return [account];
  }


  export const accountsFiltered = (filter: string ) => (s: AppState) => {
    const allAccounts = allAccountsSelector(s);

    const matchingAccounts = Object.keys(allAccounts).filter(a => a === ROOT_ACCOUNT || a.includes(filter.trim()));

    const matchingAccountsAndTheirAncestors = matchingAccounts.reduce( (prev, curr) => ([
      ...prev,
      ...getAncestors(allAccounts, curr),
    ]), []);

    return matchingAccountsAndTheirAncestors.reduce((prev, curr) => ({
      ...prev, 
      [curr.name]: curr,
    }), { } as AccountMap);
  }

  export const isLeftMenuOpenSelector = (s: AppState) => {
    return s.ui.isLeftMenuOpen;
  };

  export const isTransactionPanelOpenSelector = (tab: string) => (s: AppState) => {
    return editedTransactionSelector(tab)(s) !== undefined;
  };

  export const isLoadingSelector = (s: AppState) => {
    return s.ui.isLoading;
  };

  export const selectedAccountsSelector = (tab: string) => (s: AppState) => {
    return tabSelector(s, tab).selectedAccounts;
  };

  export const tabsSelector = (s: AppState): Tabs => {
    return s.ui.tabs;
  };

  export const selectedTransactionsSelector = (tab: string) => (s: AppState) => {
    const t = tabSelector(s, tab);
    const filters = t.filters;
    const allTransactions = Object.values(s.entities.transactions);

    const accountFilter = doesTransactionUseAccountsFilter(t.selectedAccounts);
    const inputFilter = doesTransactionContainInput(filters.input);
    const datesFilter = isTransactionBetweenDates(filters.minDate, filters.maxDate);
    const onlyInvalidFilter = isTransactionOnlyInvalid(filters.showOnlyInvalid, s.computed.invalidTransactions);

    const finalFilter = AND([accountFilter, inputFilter, datesFilter, onlyInvalidFilter]);

    return allTransactions.filter(finalFilter);
  };

  export const rootAccountSelector = (s: AppState) => {
    return ROOT_ACCOUNT;
  };

  export const invalidTransactionsSelector = (s: AppState) => {
    return s.computed.invalidTransactions;
  };

  export const filtersSelector = (tab: string) => (s: AppState) => {
    return tabSelector(s, tab).filters;
  };

  export const minAndMaxAllowedDateSelector = (s: AppState) =>  {
    return Object.values(s.entities.transactions).reduce<{min?: number, max?: number}>(
      (prev, curr) => ({
          min: prev.min ? Math.min(prev.min!, curr.header.date) : curr.header.date,
          max: prev.max ? Math.max(prev.max!, curr.header.date) : curr.header.date,
        }),
      {},
    );
  };

  /* Helpers */

const doesTransactionUseAccountsFilter = (accountsNames: string[]) => (tr: TransactionWithUUID): boolean => {
    if (accountsNames.find(n => n === ROOT_ACCOUNT)) {
      return true;
    }
    return tr.postings.some( p => accountsNames.indexOf(p.account) !== -1 );
  };

  const doesTransactionContainInput = (query: string) => (tr: TransactionWithUUID): boolean => {
    if (query === undefined || query === '' ) {
      return true;
    }

    const words = query.split(' ').filter(s => s !== '').map( s => s.toLowerCase());

    return words.some( word => {
      let titleMatches, amountOrAccountMatches = false;
      titleMatches = tr.header.title && tr.header.title.toLowerCase().indexOf(word) >= 0;
      amountOrAccountMatches = tr.postings.some( p => {
          return p.account.toLowerCase().indexOf(word) >= 0 || (p.amount !== undefined && p.amount.toString().indexOf(word.replace(',', '.')) >= 0);
      });

      return titleMatches || amountOrAccountMatches;
    });
  };

  const isTransactionBetweenDates = (start: number | undefined, end: number | undefined) => (tr: TransactionWithUUID): boolean => {
    return (!start || tr.header.date >= start) && (!end || tr.header.date <= end);
  };

  const isTransactionOnlyInvalid = (onlyInvalid: boolean, invalidIds: string[]) => (tr: TransactionWithUUID): boolean => {
      if (!onlyInvalid) { return true; }
      return invalidIds.includes(tr.uuid);
  };

  type Validator<T> = (T) => boolean;

  const AND = <U>(validators: Validator<U>[]): Validator<U> => {
    return (obj: U) => validators.every(v => v(obj));
  };
