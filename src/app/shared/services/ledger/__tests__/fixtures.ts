import Decimal from 'decimal.js';
import * as moment from 'moment';
import { Transaction } from '../../../models/transaction';

export const emptyFile = '';

export const oneTransactionFile = `
2017/01/13 ! Transaction
    CompteA:Sous compte      41.3€ ;Commentaire
    * CompteB
`;

export const transactions: Transaction[] = [
  {
    header: {
      date: moment.utc('2013-02-08').unix(),
      title: 'Transaction title',
    },
    postings: [
      {
        account: 'accountA',
        tag: '!',
        amount: '3.14',
        currency: '€',
        comment: 'Comment',
      },
      {
        account: 'accountB',
      },
    ],
  },
];
