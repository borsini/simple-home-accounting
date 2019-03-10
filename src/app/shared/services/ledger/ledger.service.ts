
import {from as observableFrom,  Observable } from 'rxjs';

import {toArray, map, mergeMap} from 'rxjs/operators';
import { Injectable } from '@angular/core';

import { Transaction } from '../../models/transaction';

import Decimal from 'decimal.js';
import * as moment from 'moment';
import * as pegjs from 'pegjs';


import { Posting } from '../../models/posting';



@Injectable()
export class LedgerService {

  private _parser: pegjs.Parser;

  constructor() {
    const grammar =
    `
    Start
    = NewLineOrCommentBlock? 
      trs:(
        tr:Transaction Newline?
          NewLineOrCommentBlock? {return tr}
      )*
      { return trs }
  
  NewLineOrCommentBlock = (Comment / Newline)*
      
  Transaction
    = fl:FirstLine
      sls:(sl:SecondLine { return sl} )+
      { return { header:fl, postings:sls }}
  
  FirstLine
    = d:Date _* tg:(tag:ClearingTag _ { return tag })? t:StringWithoutComment c:Comment? Newline
    {
      return { date:d, title:t.trim(), clearTag:tg, tags:c ? c.tags : [], comments: c ? c.str.trim() : null }
    }
  
  SecondLine
    =
    _+
    ct:(ct:ClearingTag _ { return ct })?
    a:Account
    _*
    c:CurrencyCombinations?
    _*
    cm:Comment?
    Newline?
    {
      return {
        tag:ct,
        account:a,
        sign:c ? c.sign : null,
        amount:c ? c.amount : null,
        currency:c ? c.currency : null,
        comment:cm ? cm.str : null,
        tags:cm ? cm.tags : []
      }
    }
  
  Comment
    = CommentStartChars _* str:StringWithTags { return str; }
    
  CommentStartChars = [';']
  
  CurrencyCombinations = a1:Line / a2:Line2 / a3:Line3
  
  Line = 
      sign:'-'? _* num:Number _* n:CurrencyName?
      {
        return { sign:sign, currency:n, amount:num }
      }
      
  Line2 = 
      sign:'-'? _* n:CurrencyName? _* num:Number
      {
        return { sign:sign, currency:n, amount:num }
      }
      
  Line3 =
    n:CurrencyName? _* sign:'-'? _* num:Number
      {
        return { sign:sign, currency:n, amount:num }
      }
      
  Number = $([0-9]+ ('.' decimals:[0-9]*)?)
    
  CurrencyName
    = '"' chars:CurrencyNameWithEscaping '"' { return chars.join("") }
    / chars:CurrencyNameWithoutEscaping { return chars.join("") }
  
  CurrencyNameWithoutEscaping
    = (!(CommentStartChars / Newline / "-" / "+" / '"' / [0-9] / _) c:. { return c })+
  
  CurrencyNameWithEscaping 
    = (!(CommentStartChars / Newline / "-" / "+" / '"') c:. { return c })+
  
  Date
    = d:((d:[0-9]+ {return d.join("")})'/'(m:[0-9]+ { return m.join("") })'/'(y:[0-9]+ { return y.join("")} )) 
    { return d.join("") }
  
  ClearingTag
    = ['*','!']
  
  StringWithoutComment
    = t:(
      !(CommentStartChars / Newline) c:. { return c }
      )+
      { return t.join('') }
  
  StringWithTags = rs:RawString {
    const t = rs.split(':');
      
    if(t.length > 2) { //there is a tag in it
      const tags = t.splice(1, t.length - 2);
      return { str:t.join('').trim(), tags }
    } else {
      return { str:rs.trim(), tags:[] } 
    }
  }
  
  RawString = chars:(!Newline c:. { return c })* { return chars.join("") }
  
  Account
    =  letters:(!"  " !"\\t" !"\\n" letter:. { return letter })* 
    {
      return letters.join("")
    }
  
  _ "whitespace or tab"
    = [' ', '\\t']
  
  Newline
  = '\\n' / '\\n\\r'/ '\\r\\n' / '\\r'
  `;
  
  this._parser = pegjs.generate(grammar);
  }

  parseLedgerString(text: string): Observable<Transaction[]> {
    return this.parseObservable(text).pipe(
    mergeMap(trs => observableFrom(trs)),
    map( t => {
      return {
        uuid: undefined,
        header : {
          date: moment.utc(t.header.date, 'YYYY/MM/DD').unix(),
          title: t.header.title,
          isVerified: t.header.clearTag === '*',
          tags: t.header.tags,
        },
        postings : t.postings.map(p => {
          const pt: Posting = {
            tag: p.tag,
            account: p.account,
            currency: p.currency,
            comment: p.comment,
            tags: p.tags,
          };

          pt.amount = p.amount ?  (p.sign || '') + p.amount : undefined;

          return pt;
        }),
      };
    }),
    toArray(),);
  }

  private parseObservable(text: string): Observable<LedgerTransaction[]> {
    return new Observable<LedgerTransaction[]>( obs => {
      obs.next(this._parser.parse(text) as LedgerTransaction[]);
      obs.complete();
    });
  }

  generateLedgerString(transactions: Transaction[]): Observable<string> {
    return new Observable( obs => {
      let out = '';
      transactions.forEach( tr => {

        out += [
          moment.unix(tr.header.date).format('YYYY/MM/DD'),
          tr.header.isVerified ? '*' : null,
          tr.header.title,
          tr.header.tags.length > 0 ? ';:' + tr.header.tags.join(':') + ':' : ''
        ]
          .filter(val => val)
          .join(' ') + '\n';


        tr.postings.forEach( p => {
            out += '    ';
            out += [p.tag, p.account].filter(val => val).join(' ');

            if (p.amount) {
              out += '    ';
              out += [p.currency, p.amount].filter(val => val).join(' ');
            }

            if (p.comment || (p.tags && p.tags.length > 0)) {
              out += ' ; ';
              
              if (p.comment) {
                out +=  p.comment;
              }
              if (p.tags && p.tags.length > 0) {
                out += ' :' + p.tags.join(':') + ':'
              }
            }

            out += '\n';
        });

        out += '\n';
      });

      obs.next(out);
      obs.complete();
    });
  }
}

export interface LedgerTransaction {
  header: LedgerHeader;
  postings: Array<LedgerPosting>;
}

type ClearTag = "*" | "!";

interface LedgerHeader {
  date: string;
  title: string;
  clearTag: ClearTag | undefined;
  tags: string[],
}

export interface LedgerPosting {
  tag: string | undefined;
  sign: string | undefined;
  account: string;
  amount: string | undefined;
  currency: string | undefined;
  comment: string | undefined;
  tags: string[],
}
