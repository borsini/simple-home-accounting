import { transactionWithNestedAccounts } from './fixtures';
import { AnyAction } from 'redux';
import { rootReducer, AppStateActions } from '../app-state-reducer';
import { transactions } from './fixtures';

const assertExecutionTimeLessThan = (func, maxTime, iterations = 1) => {
    const totalTime = new Array(iterations).fill(0).map( _ => {
        const start = new Date().getTime();
        func();
        const end = new Date().getTime();

        const diff = end - start;
        console.log('Execution time:', diff);
        return diff;
    }).reduce<number>( (prev, curr) => prev + curr, 0);

    const mean = totalTime / iterations;

    console.log('Mean:', mean);
    expect(mean).toBeLessThan(maxTime);
};

describe(rootReducer.name, () => {
  it('adds 10k transactions in less than a second', () => {
    const action = AppStateActions.addTransactions(new Array(10000).fill(transactionWithNestedAccounts));
    assertExecutionTimeLessThan( () => rootReducer(undefined, action), 1000);
  });
});
