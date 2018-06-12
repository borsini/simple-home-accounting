import * as moment from 'moment';
import Decimal from 'decimal.js';
import { Transaction } from '../../models/transaction';

export const transactions: Transaction[] = [
  {
    header: {
      date: moment.utc('2013-02-08').unix(),
      title: 'Bread',
      tags: [],
    },
    postings: [
      {
        account: 'Bank',
        tag: '!',
        amount: '-3.05',
        currency: '$',
        comment: 'Comment',
        tags: [],
      },
      {
        account: 'Expenses',
        tags: ['HOLIDAYS', 'SUMMER'],
      },
    ],
  },
  {
    header: {
      date: moment.utc('2013-02-10').unix(),
      title: 'Salary',
      tags: [],
    },
    postings: [
      {
        account: 'Bank',
        amount: '500',
        currency: '€',
        tags: [],
      },
      {
        account: 'Job',
        tags: [],
      },
    ],
  },
];

export const transactionWithNestedAccounts: Transaction = {
  header: {
    date: moment.utc('2013-02-10').unix(),
    title: 'Savings',
    tags: [],
  },
  postings: [
    {
      account: 'Assets:Bank',
      amount: '100',
      currency: '€',
      tags: [],
    },
    {
      account: 'Assets:Bank:Savings',
      amount: '42',
      currency: '€',
      tags: [],
    },
    {
      account: 'Income:Job',
      tags: [],
    },
  ],
};

export const transactionsWithMissingAmounts: Transaction[] = [
  {
    header: {
      date: moment.utc('2013-02-10').unix(),
      title: 'Salary',
      tags: [],
    },
    postings: [
      {
        account: 'Bank',
        amount: '1000',
        currency: '€',
        tags: [],
      },
      {
        account: 'Job',
        tags: [],
      },
    ],
  },
  {
    header: {
      date: moment.utc('2013-02-11').unix(),
      title: 'Bread',
      tags: [],
    },
    postings: [
      {
        account: 'Cash',
        amount: '-3.14',
        currency: '€',
        tags: [],
      },
      {
        account: 'Daily expenses',
        amount: '',
        tags: [],
      },
    ],
  },
];
