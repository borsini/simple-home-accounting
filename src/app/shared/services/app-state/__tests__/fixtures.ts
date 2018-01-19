import * as moment from 'moment';
import Decimal from 'decimal.js';
import { Transaction } from '../../../models/transaction';
import { Account } from '../../../models/account';

export const transactions: [Transaction] = [
  {
    header: {
      date: moment.utc('2013-02-08'),
      title: 'Bakery',
    },
    postings: [
      {
        account: 'Bank:Current account',
        tag: '!',
        amount: new Decimal(-3.05),
        currency: '$',
        comment: 'Comment',
      },
      {
        account: 'Expenses:Grocery:Bread',
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
        account: 'Bank:Current account',
        amount: new Decimal(500),
        currency: '€',
      },
      {
        account: 'Incomes:Salary',
      },
    ],
  },
];

export const accounts = [new Account('Account A'), new Account('Account B')];
