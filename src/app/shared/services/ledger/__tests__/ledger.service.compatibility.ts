import { LedgerService } from '../ledger.service';
import * as moment from 'moment';

const transactions = [
  {
    header: {
      date: moment.utc('2013-02-08').unix(),
      title: 'Bread',
      isVerified: true,
      tags: []
    },
    postings: [
      {
        account: 'Expenses:Daily',
        amount: '2.45',
        currency: 'EUR',
        tags: []
      },
      {
        account: 'Bank:Account',
        amount: '-2.45',
        currency: 'EUR',
        tags: []
      },
    ],
  },
  {
    header: {
      date: moment.utc('2013-02-08').unix(),
      title: 'Butter',
      isVerified: true,
      tags: ["tag"]
    },
    postings: [
      {
        account: 'Expenses:Daily',
        amount: '3.14',
        currency: 'EUR',
        tags: []
      },
      {
        account: 'Cash',
        tags: []
      },
    ],
  }
]

new LedgerService().generateLedgerString(transactions).subscribe(console.log)