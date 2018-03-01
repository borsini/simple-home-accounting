import { Injectable } from '@angular/core';
import Decimal from 'decimal.js';
import * as moment from 'moment';
import { Observable } from 'rxjs/Observable';
import { Transaction } from '../../models/transaction';
import { xmlToJson } from '../../utils/utils';

@Injectable()
export class OfxService {
  constructor() {}

  parseOfxString(ofxString: string): Observable<Transaction[]> {
    return new Observable(obs => {
      const xmlOfx = ofxString
        // Remove empty spaces and line breaks between tags
        .replace(/>\s+</g, '><')
        // Remove empty spaces and line breaks before tags content
        .replace(/\s+</g, '<')
        // Remove empty spaces and line breaks after tags content
        .replace(/>\s+/g, '>')
        // Remove dots in start-tags names and remove end-tags with dots
        .replace(/<([A-Z0-9_]*)+\.+([A-Z0-9_]*)>([^<]+)(<\/\1\.\2>)?/g, '<$1$2>$3')
        // Add a new end-tags for the ofx elements
        .replace(/<(\w+?)>([^<]+)/g, '<$1>$2</<added>$1>')
        // Remove duplicate end-tags
        .replace(/<\/<added>(\w+?)>(<\/\1>)?/g, '</$1>');

      const jsOfx = xmlToJson(new DOMParser().parseFromString(xmlOfx, 'text/xml'));

      const transactions: Transaction[] = [];

      let STMTTRNRS = jsOfx.OFX.BANKMSGSRSV1.STMTTRNRS;

      if (!(STMTTRNRS instanceof Array)) {
        STMTTRNRS = [STMTTRNRS];
      }

      STMTTRNRS.forEach(trList => {
        const response = trList.STMTRS;

        if (!response) {
          return;
        }

        const c = response.CURDEF['#text'];
        const acc = response.BANKACCTFROM.ACCTID['#text'];

        let STMTTRN: any = response.BANKTRANLIST.STMTTRN;

        if (!(STMTTRN instanceof Array)) {
          STMTTRN = [STMTTRN];
        }

        STMTTRN.forEach(tr => {
          const d = moment.utc(tr.DTPOSTED['#text'], 'YYYYMMDD');
          const a: string = tr.TRNAMT['#text'];
          const n = tr.NAME['#text'];
          const m = tr.MEMO['#text'];

          const t: Transaction = {
            header: {
              tag: '',
              date: d,
              title: n,
            },
            postings: [
              {
                tag: '',
                account: acc,
                amount: a.replace('+', ''),
                currency: c,
                comment: m,
              },
            ],
          };
          transactions.push(t);
        });
      });

      obs.next(transactions);
      obs.complete();
    });
  }
}
