import * as moment from 'moment';
import Decimal from 'decimal.js';
import { Transaction } from '../../../models/transaction';
import { Account } from '../../../models/account';

export const transactions: [Transaction] = [
  {
    header: {
      date: moment.utc('2013-02-08'),
      title: 'Bread',
    },
    postings: [
      {
        account: 'Bank',
        tag: '!',
        amount: new Decimal(-3.05),
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
        amount: new Decimal(500),
        currency: '€',
      },
      {
        account: 'Job',
      },
    ],
  },
];

export const transactionWithNestedAccounts = {
  header: {
    date: moment.utc('2013-02-10'),
    title: 'Savings',
  },
  postings: [
    {
      account: 'Assets:Bank',
      amount: new Decimal(100),
      currency: '€',
    },
    {
      account: 'Assets:Bank:Savings',
      amount: new Decimal(42),
      currency: '€',
    },
    {
      account: 'Income:Job',
    },
  ],
};
