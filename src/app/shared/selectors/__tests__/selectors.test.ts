import * as moment from 'moment';

import { accountsFiltered, editedTransactionSelector, selectedTransactionsSelector, tabsSelector } from '../selectors';
import { AccountMap } from '../../models/app-state';
import { rootReducer, AppStateActions } from '../../reducers/app-state-reducer';
import { Transaction } from '../../models/transaction';

const transactionsFixture = [ 
  {
    header: {
      date: moment.utc('2013-02-08').unix(),
      title: 'Bread',
      isVerified: true,
      tags: []
    },
    postings: [
      {
        account: 'A:B:C',
        amount: '2',
        tags: []
      },
      {
        account: 'A:B:D',
        tags: []
      },
    ],
  }
];

jest.mock('uuid', () => {
  let counter = 0;

  return {
    v4: jest.fn(() => {
      const uuid = `uuid ${counter}`;
      counter++;
      return uuid;
    }),
    reset: () => counter = 0,
  };
});


beforeEach( () => {
  require('uuid').reset();
});

describe(accountsFiltered.name, () => {
  it('returns root by default', () => {
    const state = rootReducer(undefined, AppStateActions.addTransactions([]));

    const result = accountsFiltered('')(state);

    expect(Object.keys(result)).toEqual(['ROOT']);
  });

  it('returns all accounts by default', () => {
    const state = rootReducer(undefined, AppStateActions.addTransactions(transactionsFixture));
    
    const result = accountsFiltered('')(state);

    expect(Object.keys(result)).toEqual(['ROOT', 'A', 'A:B', 'A:B:C', 'A:B:D']);
  });

  it('filters correctly', () => {
    const state = rootReducer(undefined, AppStateActions.addTransactions(transactionsFixture));
    
    const result = accountsFiltered('B')(state);

    expect(Object.keys(result).sort()).toEqual(['ROOT', 'A', 'A:B', 'A:B:C', 'A:B:D'].sort());
  });
});

describe(editedTransactionSelector.name, () => {
  it('returns transaction with uuid', () => {
    const state = rootReducer(undefined, AppStateActions.addTransactions(transactionsFixture));
    const state2 = rootReducer(state, AppStateActions.openTab(['A']));
    const firstTab = Object.keys(tabsSelector(state2))[0];
    const transactions = selectedTransactionsSelector(firstTab)(state2);
    const firstTransaction = transactions[0];
    const state3 = rootReducer(state, AppStateActions.setEditedTransaction(firstTransaction, firstTab));

    const result = editedTransactionSelector(firstTab)(state3);

    expect(result).toMatchSnapshot();
  });

  it('returns transaction with no uuid', () => {
    const state = rootReducer(undefined, AppStateActions.openTab(['A']));
    const firstTab = Object.keys(tabsSelector(state))[0];
    const newTransaction = transactionsFixture[0];
    const state3 = rootReducer(state, AppStateActions.setEditedTransaction(newTransaction, firstTab));

    const result = editedTransactionSelector(firstTab)(state3);

    expect(result).toEqual(newTransaction);
  });
});

