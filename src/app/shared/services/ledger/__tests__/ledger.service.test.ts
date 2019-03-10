
import {mergeMap, tap} from 'rxjs/operators';
import { emptyFile, oneTransactionFile, transactions } from './fixtures';
import { LedgerService } from '../ledger.service';





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
    const loadAndSave = service.parseLedgerString(oneTransactionFile).pipe(
      tap(x => parsedTransactions = x),
      mergeMap(tr => service.generateLedgerString(tr).pipe(mergeMap(value => service.parseLedgerString(value)))),);

    return expect(loadAndSave.toPromise()).resolves.toEqual(parsedTransactions);
  });
});
