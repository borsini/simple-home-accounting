import * as moment from 'moment';
import Decimal from 'decimal.js';
import { Transaction } from '../../models/transaction';

export const transactions: Transaction[] = [
  {
    header: {
      date: moment.utc('2013-02-08'),
      title: 'Bread',
    },
    postings: [
      {
        account: 'Bank',
        tag: '!',
        amount: '-3.05',
        currency: '$',
        comment: 'Comment',
      },
      {
        account: 'Expenses',
      },
    ],
  },
  {
    header: {
      date: moment.utc('2013-02-10'),
      title: 'Salary',
    },
    postings: [
      {
        account: 'Bank',
        amount: '500',
        currency: '€',
      },
      {
        account: 'Job',
      },
    ],
  },
];

export const transactionWithNestedAccounts: Transaction = {
  header: {
    date: moment.utc('2013-02-10'),
    title: 'Savings',
  },
  postings: [
    {
      account: 'Assets:Bank',
      amount: '100',
      currency: '€',
    },
    {
      account: 'Assets:Bank:Savings',
      amount: '42',
      currency: '€',
    },
    {
      account: 'Income:Job',
    },
  ],
};
