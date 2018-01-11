import { inject, TestBed } from '@angular/core/testing';
import {emptyFile, oneTransactionFile, simpleFile} from './fixtures';
import { OfxService } from '../ofx.service';
import 'rxjs/add/operator/toPromise';

describe('OfxService', () => {

  it('parses empty file', () => {
    const service = new OfxService();

    return expect(service.parseOfxString(emptyFile).toPromise()).rejects.toMatchSnapshot();
  });

  it('parses simple file', () => {
    const service = new OfxService();

    return expect(service.parseOfxString(simpleFile).toPromise()).resolves.toMatchSnapshot();
  });

  it('parses file with one transaction', () => {
    const service = new OfxService();

    return expect(service.parseOfxString(oneTransactionFile).toPromise()).resolves.toMatchSnapshot();
  });
});
