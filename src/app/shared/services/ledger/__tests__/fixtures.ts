import Decimal from 'decimal.js';
import * as moment from 'moment';
import { Transaction } from '../../../models/transaction';

export const emptyFile = '';

export const oneTransactionFile = `
2017/01/13 ! Transaction1 ; :TAG0:
    CompteA:Sous compte      41.3€ ;Commentaire :TAG 1:TAG 2:
    CompteA:Autre compte     11.3€ ;Commentaire :TAG 3:
    * CompteB

2018/01/13 * Transaction2
    CompteA:Sous compte      41.3€
    CompteA:Autre compte

2019/01/13 Transaction3
    CompteA:Sous compte      41.3€
    CompteA:Autre compte
`;

export const transactions: Transaction[] = [
  {
    header: {
      date: moment.utc('2013-02-08').unix(),
      title: 'Transaction title',
      isVerified: false,
      tags: [], 
    },
    postings: [
      {
        account: 'accountA',
        tag: '!',
        amount: '3.14',
        currency: '€',
        comment: 'Comment',
        tags: [],
      },
      {
        account: 'accountB',
        tags: [],
      },
    ],
  },
];
