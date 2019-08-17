import { inject, TestBed } from '@angular/core/testing';
import { emptyFile, oneTransactionFile, simpleFile, invalidFile } from './fixtures';
import { OfxService } from '../ofx.service';


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

  it('sends error if file is invalid', () => {
    const service = new OfxService();

    return expect(service.parseOfxString(invalidFile).toPromise()).rejects.toMatchSnapshot();
  });
});
