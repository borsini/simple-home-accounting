import { Injectable } from '@angular/core';
import {Observable, BehaviorSubject, ReplaySubject, Subject} from 'rxjs'
import { Transaction } from './models/models'
import * as pegjs from 'pegjs';

@Injectable()
export class LedgerService {

  private _parser: pegjs.Parser;

  constructor() {
    let grammar = 
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
      = d:Date _* tg:(tag:ClearingTag _ { return tag })? t:(t:Title { return t })? Newline
      {
        return { date:d, title:t, tag:tg }
      }
    
    SecondLine
      =
      _+
      ct:(ct:ClearingTag _ { return ct })?
      a:Account _* a1:AmountAndCurrency1? a2:AmountAndCurrency2? _* cm:Comment?
      Newline?
      {
        let amountType = a1 || a2;
        let amount = amountType ? amountType.amount : null;
        let currency = amountType ? amountType.currency : null;
        return {
          
          tag:ct, account:a, amount:amount, currency:currency, comment:cm
        }
      }
    
    Comment
      = CommentStartChars _* cm:(!'\\n' c:. { return c })* { return cm.join("") }
    
    CommentStartChars = [';']
    
    CurrencyName
      = c:(!Comment !Newline c:[^0-9 ] { return c })+ { return c.join("") }
    
    AmountAndCurrency1 =
      !CommentStartChars
      sign:'-'?
        _*
        units:(units:[0-9]+ { return units.join("") })
        decimals:('.' decimals:[0-9]*{ return decimals.join("") })?
        _*
        n:CurrencyName?
        {
          var a = (sign || "") + units + (decimals ? "." + decimals : "");
          return { currency:n, amount:Number.parseFloat(a) }
        }
      
    AmountAndCurrency2 =
      !CommentStartChars
      sign:'-'?
        _*
        n:CurrencyName?
        _*
        units:(units:[0-9]+ { return units.join("") })
        decimals:('.' decimals:[0-9]*{ return decimals.join("") })?
        {
          var a = (sign || "") + units + (decimals ? "." + decimals : "");
          return { currency:n, amount:Number.parseFloat(a) }
        }
        
    Date
      = d:((d:[0-9]+ {return d.join("")})'/'(m:[0-9]+ { return m.join("") })'/'(y:[0-9]+ { return y.join("")} )) 
      { return d.join("") }
    
    ClearingTag
      = ['*','!']
    
    Title
      = t:[^\\n]+ { return t.join("") }
    
    Account
      =  letters:(!"  " !"\\t" !"\\n" letter:. { return letter })* 
      {
        return letters.join("")
      }
    
    _ "whitespace or tab"
      = [' ', '\\t']
    
    Newline
     = ['\\n', '\\r', '\\n\\r']    
    `
    this._parser = pegjs.generate(grammar);
  }

  parseLedgerString(text: string) : Observable<Transaction[]>{
    return new Observable( obs => {
      obs.next(this._parser.parse(text))
      obs.complete()
    })
  }
}
