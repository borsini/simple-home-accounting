import { AppStateService } from '../app-state.service';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/observable/zip';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/first';
import { transactions } from './fixtures';
import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/take';
import { accounts } from './fixtures';

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

describe(AppStateService.name, () => {
  describe('allTransactionsColdObservable', () => {
    it('returns nothing at startup', async () => {
      const service = new AppStateService();

      const allTransactions = await service.allTransactionsColdObservable().toPromise();

      return expect(allTransactions).toMatchSnapshot();
    });

    it('returns transactions', async () => {
      const service = new AppStateService();
      await service.setTransactionsColdObservable(transactions, false).toPromise();

      const allTransactions = await service.allTransactionsColdObservable().toPromise();

      return expect(allTransactions).toMatchSnapshot();
    });
  });

  describe('rootAccountHotObservable', () => {
    it('returns nothing at startup', async () => {
      const service = new AppStateService();

      const account = await service
        .rootAccountHotObservable()
        .take(1)
        .toPromise();

      return expect(account).toMatchSnapshot();
    });

    it('returns account', async () => {
      const service = new AppStateService();
      await service.setTransactionsColdObservable(transactions, false).toPromise();

      const account = await service
        .rootAccountHotObservable()
        .take(1)
        .toPromise();

      return expect(account).toMatchSnapshot();
    });
  });

  describe('setEditedTransactions', () => {
    it('modifies currently edited transaction', async () => {
      const service = new AppStateService();

      await service.setEditedTransactionColdObservable(transactions[0]).toPromise();
      const editedTransaction = await service
        .editedTransactionHotObservable()
        .take(1)
        .toPromise();

      return expect(editedTransaction).toEqual(transactions[0]);
    });

    it('resets currently edited transaction', async () => {
      const service = new AppStateService();

      await service.setEditedTransactionColdObservable(transactions[0]).toPromise();
      await service.setEditedTransactionColdObservable().toPromise();
      const editedTransaction = await service
        .editedTransactionHotObservable()
        .take(1)
        .toPromise();

      return expect(editedTransaction).toBeUndefined();
    });
  });

  describe('selectAccountsColdObservable', () => {
    it('selects accounts', async () => {
      const service = new AppStateService();

      await service.selectAccountsColdObservable(true, accounts).toPromise();
      const selectedAccounts = await service
        .selectedAccountsHotObservable()
        .take(1)
        .toPromise();

      return expect(selectedAccounts).toMatchSnapshot();
    });

    it('unselects accounts', async () => {
      const service = new AppStateService();

      await service.selectAccountsColdObservable(true, accounts).toPromise();
      await service.selectAccountsColdObservable(false, accounts.slice(1, 2)).toPromise();
      const selectedAccounts = await service
        .selectedAccountsHotObservable()
        .take(1)
        .toPromise();

      return expect(selectedAccounts).toMatchSnapshot();
    });
  });

  describe('setTransactionsColdObservable', () => {
    it('replaces transactions', async () => {
      const service = new AppStateService();
      await service.setTransactionsColdObservable([transactions[0]], true).toPromise();
      await service.setTransactionsColdObservable([transactions[1]], false).toPromise();

      const allTransactions = await service.allTransactionsColdObservable().toPromise();

      return expect(allTransactions).toMatchSnapshot();
    });

    it('appends transactions', async () => {
      const service = new AppStateService();
      await service.setTransactionsColdObservable([transactions[0]], true).toPromise();
      await service.setTransactionsColdObservable([transactions[1]], true).toPromise();

      const allTransactions = await service.allTransactionsColdObservable().toPromise();

      return expect(allTransactions).toMatchSnapshot();
    });

    it('empties selected accounts', async () => {
      const service = new AppStateService();

      await service.selectAccountsColdObservable(true, accounts).toPromise();
      await service.setTransactionsColdObservable(transactions, true).toPromise();

      const selectedAccounts = await service
        .selectedAccountsHotObservable()
        .take(1)
        .toPromise();

      return expect(selectedAccounts).toMatchSnapshot();
    });

    it('sets root account', async () => {
      const service = new AppStateService();
      await service.setTransactionsColdObservable(transactions, true).toPromise();

      const account = await service
        .rootAccountHotObservable()
        .take(1)
        .toPromise();

      return expect(account).toMatchSnapshot();
    });
  });

  describe('editedTransactionHotObservable', () => {
    it('returns nothing at startup', async () => {
      const service = new AppStateService();

      const editedTransaction = await service
        .editedTransactionHotObservable()
        .take(1)
        .toPromise();

      return expect(editedTransaction).toBeUndefined();
    });

    it('returns edited transaction', async () => {
      const service = new AppStateService();
      await service.setEditedTransactionColdObservable(transactions[0]).toPromise();

      const editedTransaction = await service
        .editedTransactionHotObservable()
        .take(1)
        .toPromise();

      return expect(editedTransaction).toMatchSnapshot();
    });
  });

  describe('allAccountsFlattenedHotObservable', () => {
    it('returns nothing at startup', async () => {
      const service = new AppStateService();

      const allAccounts = await service
        .allAccountsFlattenedHotObservable()
        .take(1)
        .toPromise();

      return expect(allAccounts).toMatchSnapshot();
    });
  });
});
