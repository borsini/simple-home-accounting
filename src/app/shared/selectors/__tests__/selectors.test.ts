import * as moment from 'moment';

import { accountsFiltered } from '../selectors';
import { AccountMap } from '../../models/app-state';
import { rootReducer, AppStateActions } from '../../reducers/app-state-reducer';

const transactions = [ 
  {
    header: {
      date: moment.utc('2013-02-08').unix(),
      title: 'Bread',
    },
    postings: [
      {
        account: 'A:B:C',
        amount: '2',
      },
      {
        account: 'A:B:D',
      },
    ],
  }
];

describe(accountsFiltered.name, () => {
  it('returns root by default', () => {
    const state = rootReducer(undefined, AppStateActions.addTransactions([]));

    const result = accountsFiltered('')(state);

    expect(Object.keys(result)).toEqual(['ROOT']);
  });

  it('returns all accounts by default', () => {
    const state = rootReducer(undefined, AppStateActions.addTransactions(transactions));
    
    const result = accountsFiltered('')(state);

    expect(Object.keys(result)).toEqual(['ROOT', 'A', 'A:B', 'A:B:C', 'A:B:D']);
  });

  it('filters correctly', () => {
    const state = rootReducer(undefined, AppStateActions.addTransactions(transactions));
    
    const result = accountsFiltered('B')(state);

    expect(Object.keys(result).sort()).toEqual(['ROOT', 'A', 'A:B', 'A:B:C', 'A:B:D'].sort());
  });
});

