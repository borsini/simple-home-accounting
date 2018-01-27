import {
  emptyFile,
  fileWithOneTransaction,
  fileWithTwoTransactions,
  fileWithOneSplit,
  fileWithNoAMount,
  fileWithLineBreak,
} from './fixtures';
import { GnucashService } from '../gnucash.service';
import 'rxjs/add/operator/toPromise';

describe(GnucashService.name, () => {
  it('parses empty file', () => {
    const service = new GnucashService();

    return expect(service.parseGnucashString(emptyFile).toPromise()).rejects.toMatchSnapshot();
  });

  it('parses file with one transaction', () => {
    const service = new GnucashService();

    return expect(service.parseGnucashString(fileWithOneTransaction).toPromise()).resolves.toMatchSnapshot();
  });

  it('parses file with two transactions', () => {
    const service = new GnucashService();

    return expect(service.parseGnucashString(fileWithTwoTransactions).toPromise()).resolves.toMatchSnapshot();
  });

  it('parses file with only one split', () => {
    const service = new GnucashService();

    return expect(service.parseGnucashString(fileWithOneSplit).toPromise()).resolves.toMatchSnapshot();
  });

  it('parses file with missing amount', () => {
    const service = new GnucashService();

    return expect(service.parseGnucashString(fileWithNoAMount).toPromise()).resolves.toMatchSnapshot();
  });

  it('parses file with line break', () => {
    const service = new GnucashService();

    return expect(service.parseGnucashString(fileWithLineBreak).toPromise()).resolves.toMatchSnapshot();
  });
});
