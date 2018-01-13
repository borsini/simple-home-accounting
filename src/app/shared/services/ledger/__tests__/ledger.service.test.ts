import { inject, TestBed } from '@angular/core/testing';
import {emptyFile, oneTransactionFile} from './fixtures';
import { LedgerService } from '../ledger.service';
import 'rxjs/add/operator/toPromise';

describe(LedgerService.name, () => {

  it('parses empty file', () => {
    const service = new LedgerService();

    return expect(service.parseLedgerString(emptyFile).toPromise()).resolves.toMatchSnapshot();
  });

  it('parses file with one transaction', () => {
    const service = new LedgerService();

    return expect(service.parseLedgerString(oneTransactionFile).toPromise()).resolves.toMatchSnapshot();
  });
});
