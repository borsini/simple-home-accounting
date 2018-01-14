import Decimal from 'decimal.js';
import * as moment from 'moment';

export const emptyFile = '';

export const oneTransactionFile = `
2017/01/13 ! Transaction
    CompteA:Sous compte      41.3€ ;Commentaire
    * CompteB
`;

export const transactions = [
  {
    header: {
      date: moment.utc('2013-02-08'),
      title: 'Transaction title',
    },
    postings: [
      {
        account: 'accountA',
        tag: '!',
        amount: new Decimal(3.14),
        currency: '€',
        comment: 'Comment',
      },
      {
        account: 'accountB',
      },
    ],
  },
];
