import { AppStateService } from '../app-state.service';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/observable/zip';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/first';
import { transactions, transactionWithNestedAccounts } from './fixtures';
import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/take';
import { Transaction, TransactionWithUUID } from '../../../models/transaction';
import Decimal from 'decimal.js';
import * as moment from 'moment';

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

interface State {
  allAccountsFlattened: Account[];
  rootAccount: Account;
  allTransactions: TransactionWithUUID[];
  selectedAccounts: Set<Account>;
  editedTransaction: Transaction | undefined;
  selectedTransactions: TransactionWithUUID[];
  transactionsChanged: TransactionWithUUID[];
}

const getState = async (service: AppStateService) => {
  const allAccountsFlattened = await service
    .allAccountsFlattenedHotObservable()
    .take<Account[]>(1)
    .toPromise();
  const rootAccount = await service
    .rootAccountHotObservable()
    .take<Account | undefined>(1)
    .toPromise();
  const allTransactions = await service.allTransactionsColdObservable().toPromise();
  const selectedAccounts = await service
    .selectedAccountsHotObservable()
    .take<Set<Account>>(1)
    .toPromise();
  const editedTransaction = await service
    .editedTransactionHotObservable()
    .take<TransactionWithUUID | undefined>(1)
    .toPromise();
  const selectedTransactions = await service
    .selectedTransactionsHotObservable()
    .take<TransactionWithUUID[]>(1)
    .toPromise();
  const transactionsChanged = await service
    .transactionsChangedHotObservable()
    .take<TransactionWithUUID[]>(1)
    .toPromise();

  return {
    allAccountsFlattened,
    rootAccount,
    allTransactions,
    selectedAccounts,
    editedTransaction,
    selectedTransactions,
    transactionsChanged,
  };
};

describe(AppStateService.name, () => {
  it('has empty state at startup', async () => {
    const service = new AppStateService();
    const state = await getState(service);

    expect(state).toMatchSnapshot();
  });

  it('changes state when adding first transactions', async () => {
    // given
    const service = new AppStateService();

    // when
    await service.addTransactionsColdObservable(transactions, true).toPromise();

    // then
    const state = await getState(service);
    expect(state).toMatchSnapshot();
  });

  it('changes state when appending transactions', async () => {
    // given
    const service = new AppStateService();
    await service.addTransactionsColdObservable([transactions[0]], true).toPromise();

    // when
    await service.addTransactionsColdObservable([transactions[1]], false).toPromise();

    // then
    const state = await getState(service);
    expect(state).toMatchSnapshot();
  });

  it('changes state when adding nested accounts', async () => {
    // given
    const service = new AppStateService();

    // when
    await service.addTransactionsColdObservable([transactionWithNestedAccounts], true).toPromise();

    // then
    const state = await getState(service);
    expect(state).toMatchSnapshot();
  });

  it('changes state when replacing one transaction with another', async () => {
    // given
    const service = new AppStateService();
    await service.addTransactionsColdObservable([transactions[0]], true).toPromise();

    // when
    await service.addTransactionsColdObservable([transactions[1]], true).toPromise();

    // then
    const state = await getState(service);
    expect(state).toMatchSnapshot();
  });

  it('changes state when replacing one transaction with nothing', async () => {
    // given
    const service = new AppStateService();
    await service.addTransactionsColdObservable([transactions[0]], true).toPromise();

    // when
    await service.addTransactionsColdObservable([], true).toPromise();

    // then
    const state = await getState(service);
    expect(state).toMatchSnapshot();
  });

  it('changes state when removing transactions', async () => {
    // given
    const service = new AppStateService();
    await service.addTransactionsColdObservable(transactions, true).toPromise();

    // when
    const allTransactions = await service.allTransactionsColdObservable().toPromise();
    await service.deleteTransactionColdObservable(allTransactions[0]).toPromise();

    // then
    const state = await getState(service);
    expect(state).toMatchSnapshot();
  });

  it('changes state when editing a transaction', async () => {
    // given
    const service = new AppStateService();
    await service.addTransactionsColdObservable(transactions, true).toPromise();

    // when
    const allTransactions = await service.allTransactionsColdObservable().toPromise();
    await service.setEditedTransactionColdObservable(allTransactions[0]).toPromise();

    // then
    const state = await getState(service);
    expect(state).toMatchSnapshot();
  });

  it('changes state when updating a transaction', async () => {
    // given
    const service = new AppStateService();
    await service.addTransactionsColdObservable(transactions, true).toPromise();

    // when
    const allTransactions = await service.allTransactionsColdObservable().toPromise();
    const modifiedTransaction = {
      ...allTransactions[0],
      header: {
        title: 'New title',
        date: moment.utc('20111031', 'YYYYMMDD'),
      },
      postings: [
        {
          account: 'Account C',
          amount: new Decimal(30),
        },
        {
          account: 'Account D',
        },
      ],
    };
    await service.updateTransactionColdObservable(modifiedTransaction).toPromise();

    // then
    const state = await getState(service);
    expect(state).toMatchSnapshot();
  });

  it('changes state when selecting root account', async () => {
    // given
    const service = new AppStateService();
    await service.addTransactionsColdObservable(transactions, true).toPromise();

    // when
    const rootAccount = await service
      .rootAccountHotObservable()
      .take(1)
      .toPromise();
    await service.selectAccountColdObservable(true, rootAccount!).toPromise();

    // then
    const state = await getState(service);
    expect(state).toMatchSnapshot();
  });
});
