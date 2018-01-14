import { emptyFile, oneTransactionFile, transactions } from './fixtures';
import { LedgerService } from '../ledger.service';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/observable/zip';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/do';

describe(LedgerService.name, () => {
  it('parses empty file', () => {
    const service = new LedgerService();

    return expect(service.parseLedgerString(emptyFile).toPromise()).resolves.toMatchSnapshot();
  });

  it('parses file with one transaction', () => {
    const service = new LedgerService();

    return expect(service.parseLedgerString(oneTransactionFile).toPromise()).resolves.toMatchSnapshot();
  });

  it('saves transactions', () => {
    const service = new LedgerService();
    return expect(service.generateLedgerString(transactions).toPromise()).resolves.toMatchSnapshot();
  });

  it('loads and saves transactions', () => {
    const service = new LedgerService();

    let parsedTransactions;
    const loadAndSave = service.parseLedgerString(oneTransactionFile)
      .do(x => parsedTransactions = x)
      .flatMap(tr => service.generateLedgerString(tr).flatMap(value => service.parseLedgerString(value)));

    return expect(loadAndSave.toPromise()).resolves.toEqual(parsedTransactions);
  });
});
