import { transactionWithNestedAccounts } from './fixtures';
import { AnyAction } from 'redux';
import { rootReducer, AppStateActions, differenceReducer, concatReducer, unionReducer, intersectionReducer } from '../app-state-reducer';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/observable/zip';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/take';
import Decimal from 'decimal.js';
import * as moment from 'moment';
import { transactions } from './fixtures';

jest.mock('uuid', () => {
  let counter = 0;
  const uuids = Array.from(Array(20).keys()).map(u => `uuid ${u}`);

  return {
    v4: jest.fn(() => {
      const uuid = uuids[counter % (uuids.length - 1)];
      counter++;
      return uuid;
    }),
  };
});

describe(concatReducer.name, () => {
  it('works :)', () => {
    expect(concatReducer([], [])).toEqual([]);
    expect(concatReducer([1, 2], [])).toEqual([1, 2]);
    expect(concatReducer([], [3, 4])).toEqual([3, 4]);
    expect(concatReducer([1, 2], [2, 3])).toEqual([1, 2, 2, 3]);
  });
});

describe(unionReducer.name, () => {
  it('works :)', () => {
    expect(unionReducer([], [])).toEqual([]);
    expect(unionReducer([1, 2], [])).toEqual([1, 2]);
    expect(unionReducer([], [3, 4])).toEqual([3, 4]);
    expect(unionReducer([1, 2], [2, 3])).toEqual([1, 2, 3]);
  });
});

describe(differenceReducer.name, () => {
  it('works :)', () => {
    expect(differenceReducer([], [])).toEqual([]);
    expect(differenceReducer([1, 2], [])).toEqual([1, 2]);
    expect(differenceReducer([], [1, 2])).toEqual([]);
    expect(differenceReducer([1, 2], [1, 2])).toEqual([]);
  });
});

describe(intersectionReducer.name, () => {
  it('works :)', () => {
    expect(intersectionReducer([], [])).toEqual([]);
    expect(intersectionReducer([1, 2], [])).toEqual([]);
    expect(intersectionReducer([], [1, 2])).toEqual([]);
    expect(intersectionReducer([1, 2], [2, 3])).toEqual([2]);
  });
});

describe(rootReducer.name, () => {
  it('has empty state at startup', () => {
    const unknownAction = { type: 'unknown'};

    const state = rootReducer(undefined, unknownAction);

    expect(state).toMatchSnapshot();
  });

  it('adds new transaction', () => {
    const action = AppStateActions.addTransactions([transactions[0]]);

    const state = rootReducer(undefined, action);

    expect(state).toMatchSnapshot();
  });

  it('appends transaction', () => {
    const action = AppStateActions.addTransactions([transactions[0]]);
    const state1 = rootReducer(undefined, action);
    const action2 = AppStateActions.addTransactions([transactions[1]]);

    const finalState = rootReducer(state1, action2);

    expect(finalState).toMatchSnapshot();
  });

  it('replaces transaction', () => {
    const action = AppStateActions.addTransactions([transactions[0]]);
    const state1 = rootReducer(undefined, action);
    const action2 = AppStateActions.addTransactions([transactions[1]], true);

    const finalState = rootReducer(state1, action2);

    expect(finalState).toMatchSnapshot();
  });

  it('clears transactions', () => {
    const action = AppStateActions.addTransactions(transactions);
    const state1 = rootReducer(undefined, action);
    const action2 = AppStateActions.addTransactions([], true);

    const finalState = rootReducer(state1, action2);

    expect(finalState).toMatchSnapshot();
  });

  it('adds new transactions with nested accounts', () => {
    const action = AppStateActions.addTransactions([transactionWithNestedAccounts]);

    const state = rootReducer(undefined, action);

    expect(state).toMatchSnapshot();
  });

  it('sets edited transaction', () => {
    const transaction = [transactions[0]];
    const action1 = AppStateActions.addTransactions(transaction);
    const state = rootReducer(undefined, action1);
    const transactionId = Object.values(state.entities.transactions)[0].uuid;
    const action2 = AppStateActions.setEditedTransaction(transactionId);

    const finalState = rootReducer(state, action2);

    expect(finalState).toMatchSnapshot();
  });

  it('unsets edited transaction', () => {
    const transaction = [transactions[0]];
    const action1 = AppStateActions.addTransactions(transaction);
    const state = rootReducer(undefined, action1);
    const transactionId = Object.values(state.entities.transactions)[0].uuid;
    const action2 = AppStateActions.setEditedTransaction(transactionId);
    const state2 = rootReducer(state, action2);

    const finalState = rootReducer(state2, AppStateActions.setEditedTransaction(undefined));

    expect(finalState).toMatchSnapshot();
  });

  it('selects root account', () => {
    const state = rootReducer(undefined, AppStateActions.addTransactions([transactionWithNestedAccounts]));

    const finalState = rootReducer(state, AppStateActions.selectAccount('ROOT', true));

    expect(finalState).toMatchSnapshot();
  });

  it('unselects root account', () => {
    const state1 = rootReducer(undefined, AppStateActions.addTransactions([transactionWithNestedAccounts]));
    const state2 = rootReducer(state1, AppStateActions.selectAccount('ROOT', true));

    const finalState = rootReducer(state2, AppStateActions.selectAccount('ROOT', false));

    expect(finalState).toMatchSnapshot();
  });

  it('unselects nested account', () => {
    const state1 = rootReducer(undefined, AppStateActions.addTransactions([transactionWithNestedAccounts]));
    const state2 = rootReducer(state1, AppStateActions.selectAccount('ROOT', true));

    const finalState = rootReducer(state2, AppStateActions.selectAccount('Assets', false));

    expect(finalState).toMatchSnapshot();
  });

  it('unselects accounts from deleted transactions', () => {
    const state1 = rootReducer(undefined, AppStateActions.addTransactions([transactionWithNestedAccounts]));
    const state2 = rootReducer(state1, AppStateActions.selectAccount('Assets:Bank', true));
    const finalState = rootReducer(state2, AppStateActions.addTransactions([], true));

    expect(finalState).toMatchSnapshot();
  });

  it('deletes transaction', () => {
    const state1 = rootReducer(undefined, AppStateActions.addTransactions([transactions[0]]));
    const transactionId = Object.values(state1.entities.transactions)[0].uuid;

    const finalState = rootReducer(state1, AppStateActions.deleteTransaction(transactionId));

    expect(finalState).toMatchSnapshot();
  });

  it('updates transaction', () => {
    const state1 = rootReducer(undefined, AppStateActions.addTransactions([transactions[0]]));
    const transaction = Object.values(state1.entities.transactions)[0];
    const modifiedTransaction = {
      ...transaction,
      header: {
        ...transaction.header,
        title: 'Updated!',
      },
    };

    const finalState = rootReducer(state1, AppStateActions.updateTransaction(modifiedTransaction));

    expect(finalState).toMatchSnapshot();
  });

  it('opens left panel', () => {
    const finalState = rootReducer(undefined, AppStateActions.openLeftPanel(true));

    expect(finalState).toMatchSnapshot();
  });

  it('opens transaction panel', () => {
    const finalState = rootReducer(undefined, AppStateActions.openTransactionPanel(true));

    expect(finalState).toMatchSnapshot();
  });
});
