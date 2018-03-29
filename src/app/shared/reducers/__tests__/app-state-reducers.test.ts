import { transactionWithNestedAccounts, transactionWithMissingAmount } from './fixtures';
import { AnyAction } from 'redux';
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
import { rootReducer, AppStateActions } from '../app-state-reducer';

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

  it('adds new transaction with missing amount', () => {
    const action = AppStateActions.addTransactions([transactionWithMissingAmount]);

    const state = rootReducer(undefined, action);

    expect(state).toMatchSnapshot();
  });

  it('does not select new accounts if one is already selected', () => {
    const action = AppStateActions.addTransactions([transactions[0]]);
    const state1 = rootReducer(undefined, action);
    const finalState = rootReducer(state1, AppStateActions.addTransactions([transactions[1]]));

    expect(finalState).toMatchSnapshot();
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
    const transactionWithId = Object.values(state.entities.transactions)[0];
    const action2 = AppStateActions.setEditedTransaction(transactionWithId, 'ROOT');

    const finalState = rootReducer(state, action2);

    expect(finalState).toMatchSnapshot();
  });

  it('unsets edited transaction', () => {
    const transaction = [transactions[0]];
    const action1 = AppStateActions.addTransactions(transaction);
    const state = rootReducer(undefined, action1);
    const transactionWithId = Object.values(state.entities.transactions)[0];
    const action2 = AppStateActions.setEditedTransaction(transactionWithId, 'ROOT');
    const state2 = rootReducer(state, action2);

    const finalState = rootReducer(state2, AppStateActions.setEditedTransaction(undefined, 'ROOT'));

    expect(finalState).toMatchSnapshot();
  });

  it('unselects edited transaction if deleted', () => {
    const state = rootReducer(undefined, AppStateActions.addTransactions([transactions[0]]));
    const transactionWithId = Object.values(state.entities.transactions)[0];
    const state2 = rootReducer(state, AppStateActions.setEditedTransaction(transactionWithId, 'ROOT'));
    const finalState = rootReducer(state2, AppStateActions.deleteTransaction(transactionWithId.uuid));

    expect(finalState).toMatchSnapshot();
  });

  it('closes tab if no more accounts', () => {
    const state = rootReducer(undefined, AppStateActions.addTransactions([transactions[0]]));
    const state2 = rootReducer(state, AppStateActions.openTab(['Expenses']));
    const finalState = rootReducer(state2, AppStateActions.addTransactions([], true));

    expect(finalState).toMatchSnapshot();
  });

  it('keeps edited transaction not deleted', () => {
    const state = rootReducer(undefined, AppStateActions.addTransactions(transactions));
    const transactionsWithId = Object.values(state.entities.transactions);
    const state2 = rootReducer(state, AppStateActions.setEditedTransaction(transactionsWithId[0], 'ROOT'));
    const finalState = rootReducer(state2, AppStateActions.deleteTransaction(transactionsWithId[1].uuid));

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

  it('computes invalid transaction', () => {
    const transactionWithoutPostings = {
      header: {
        date: 1520080726,
        title: 'Titre',
      },
      postings: [],
    };
    const finalState = rootReducer(undefined, AppStateActions.addTransactions([transactionWithoutPostings]));

    expect(finalState).toMatchSnapshot();
  });

  it('saves current input', () => {
    const finalState = rootReducer(undefined, AppStateActions.setInputFilter('my input', 'ROOT'));

    expect(finalState).toMatchSnapshot();
  });

  it('saves show invalid preference', () => {
    const finalState = rootReducer(undefined, AppStateActions.showOnlyInvalid(true, 'ROOT'));

    expect(finalState).toMatchSnapshot();
  });

  it('saves min date', () => {
    const finalState = rootReducer(undefined, AppStateActions.setMinDate(1520080726, 'ROOT'));

    expect(finalState).toMatchSnapshot();
  });

  it('saves max date', () => {
    const finalState = rootReducer(undefined, AppStateActions.setMaxDate(1520080726, 'ROOT'));

    expect(finalState).toMatchSnapshot();
  });

  it('opens a tab', () => {
    const finalState = rootReducer(undefined, AppStateActions.openTab(['Account:Sub account']));

    expect(finalState).toMatchSnapshot();
  });

  it('does not open an existing tab', () => {
    const state = rootReducer(undefined, AppStateActions.openTab(['Account']));
    const finalState = rootReducer(state, AppStateActions.openTab(['Account']));

    expect(finalState).toMatchSnapshot();
  });

  it('closes a tab', () => {
    const state = rootReducer(undefined, AppStateActions.openTab(['Account:Sub account']));
    const finalState = rootReducer(undefined, AppStateActions.closeTab(Object.keys(state.ui.tabs)[0]));

    expect(finalState).toMatchSnapshot();
  });

  it('does not close an unknown tab', () => {
    const finalState = rootReducer(undefined, AppStateActions.closeTab('unknown'));

    expect(finalState).toMatchSnapshot();
  });

  it('sets loading indicator', () => {
    const finalState = rootReducer(undefined, AppStateActions.setIsLoading(true));

    expect(finalState).toMatchSnapshot();
  });

  it('unsets loading indicator', () => {
    const state = rootReducer(undefined, AppStateActions.setIsLoading(true));
    const finalState = rootReducer(state, AppStateActions.setIsLoading(false));

    expect(finalState).toMatchSnapshot();
  });
});
