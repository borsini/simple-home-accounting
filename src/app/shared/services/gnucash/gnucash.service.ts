import { Injectable } from '@angular/core';
import Decimal from 'decimal.js';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { Transaction } from '../../models/transaction';
import { xmlToJson } from '../../utils/utils';

const AmountRegex = /(.*)\/(.*)/;

@Injectable()
export class GnucashService {
  constructor() {}

  constructAccountName = (id, map) => {
    const acc = map[id];

    if (!acc) {
      return '';
    }

    const name = acc.name;
    const parent = acc.parent;

    if (!parent) {
      return name;
    }

    const parentFullName = this.constructAccountName(parent, map);
    return parentFullName ? parentFullName + ':' + name : name;
  }

  parseGnucashString(gnucashString: string): Observable<Transaction[]> {
    return new Observable(obs => {
      const jsGnucash = xmlToJson(new DOMParser().parseFromString(gnucashString, 'text/xml'));

      const jsAcc = jsGnucash['gnc-v2']['gnc:book']['gnc:account'];

      const accounts = jsAcc
        .map(a => ({
          name: a['act:name']['#text'],
          id: a['act:id']['#text'],
          parent: a['act:parent'] ? a['act:parent']['#text'] : undefined,
        }))
        .filter(a => a.name !== 'Root Account')
        .reduce((map, account) => {
          map[account.id] = account;
          return map;
        }, {});

      const toto = Object.keys(accounts).reduce((map, account) => {
        map[account] = this.constructAccountName(account, accounts);
        return map;
      }, {});

      let jsTr = jsGnucash['gnc-v2']['gnc:book']['gnc:transaction'];

      if (!Array.isArray(jsTr)) {
        jsTr = [jsTr];
      }

      const transactions: Transaction[] = jsTr.map(t => {
        const currency = t['trn:currency']['cmdty:id']['#text'];
        const datePosted = t['trn:date-posted']['ts:date']['#text'];
        const descriptionNode = t['trn:description']['#text'];
        const description = descriptionNode ? descriptionNode.replace(/(\r\n|\n|\r| {2,})/gm, '') : '';

        let splits = t['trn:splits']['trn:split'];

        if (!Array.isArray(splits)) {
          splits = [splits];
        }

        return {
          header: {
            date: moment.utc(datePosted, 'YYYY-MM-DD HH-mm-ss Z'),
            title: description,
          },
          postings: splits.map(s => {
            const rawAmount = s['split:value']['#text'];
            const reg = AmountRegex.exec(rawAmount);
            const memo = s['split:memo'] ? s['split:memo']['#text'] : undefined;
            const accountId = s['split:account']['#text'];
            const fullAccountName = toto[accountId];
            return {
              currency,
              account: fullAccountName || accountId,
              amount: reg ? new Decimal(reg[1]).dividedBy(reg[2]) : new Decimal(0),
              comment: memo,
            };
          }),
        };
      });

      obs.next(transactions || []);
      obs.complete();
    });
  }
}
