import { Injectable } from '@angular/core';
import Decimal from 'decimal.js';
import * as moment from 'moment';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/merge';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import {v4 as uuid } from 'uuid';
import { Account } from '../../models/account';
import { Transaction } from '../../models/transaction';

@Injectable()
export class AppStateService {

  private _selectedAccounts: Set<Account> = new Set();
  private _rootAccount: Account;
  private _editedTransaction?: Transaction;
  private _transactions: Map<string, Transaction> = new Map();
  private _selectedAccountsSubject: Subject<Set<Account>> = new BehaviorSubject (this._selectedAccounts);
  private _rootAccountSubject: Subject<Account | undefined> = new BehaviorSubject(undefined);
  private _editedTransactionSubject: Subject<Transaction | undefined> = new BehaviorSubject(undefined);
  private _transactionsChangedSubject: Subject<Transaction[]> = new Subject();

  /****** HOT OBSERVABLES ******/

  selectedAccountsHotObservable(): Observable<Set<Account>> {
     return this._selectedAccountsSubject.asObservable();
  }

  selectedTransactionsHotObservable(): Observable<Transaction[]> {

    const modif = this._transactionsChangedSubject.flatMap( change => this._selectedAccountsSubject );
    const selectedAccounts = this._selectedAccountsSubject;

    return Observable.merge(selectedAccounts, modif)
    .map( accounts => {
        const accountsNames = Array.from(accounts).map(a => a.name);
        return this.getTransactionsUsingAccounts(accountsNames);
      });
  }

  rootAccountHotObservable(): Observable<Account | undefined> {
    return this._rootAccountSubject.asObservable();
  }

  editedTransactionHotObservable(): Observable<Transaction | undefined> {
    return this._editedTransactionSubject.asObservable();
  }

  allAccountsFlattenedHotObservable(): Observable<Account[]> {
    return this._rootAccountSubject.flatMap( root => Observable.of(root ? this.allChildAccounts(root) : []));
  }

  transactionsChangedHotObservable(): Observable<Transaction[]> {
    return this._transactionsChangedSubject.asObservable();
  }

  /****** COLD OBSERVABLES ******/

  setEditedTransactionColdObservable(transaction?: Transaction): Observable<any> {
    return Observable.create( obs => {
      this._editedTransaction = transaction;
      this._editedTransactionSubject.next(this._editedTransaction);
      obs.complete();
    });
  }

  selectAccountsColdObservable(isSelected: boolean, accounts: Account[]): Observable<any> {
    return Observable.create( obs => {
      if (isSelected) {
        accounts.forEach( a => this._selectedAccounts.add(a) );
      } else {
        accounts.forEach( a => this._selectedAccounts.delete(a) );
      }

      this._selectedAccountsSubject.next(this._selectedAccounts);

      obs.complete();
    });
  }

  allTransactionsColdObservable(): Observable<Transaction[]> {
    return Observable.of(Array.from(this._transactions.values()));
  }

  setTransactionsColdObservable(transactions: Transaction[], append: boolean): Observable<any> {
    const o = Observable.create( obs => {
      if (!append) {
        this._transactions.clear();
      }
      transactions.forEach(tr => {
        tr.uuid = uuid();
        this._transactions.set(tr.uuid, tr);
      });
      this._selectedAccounts = new Set();
      this._selectedAccountsSubject.next(this._selectedAccounts);
      this._transactionsChangedSubject.next(Array.from(this._transactions.values()));

      obs.complete();
    });

    return Observable.concat(o, this.generateAccounts());
  }

  createOrUpdateTransactionColdObservable(transaction: Transaction): Observable<any> {
    const o = Observable.create( obs => {
      if (!transaction.uuid) {
        transaction.uuid = uuid();
      }
      this._transactions.set(transaction.uuid, transaction);
      this._transactionsChangedSubject.next([transaction]);

      obs.complete();
    });

    return Observable.concat(o, this.generateAccounts());
  }

  deleteTransactionColdObservable(transaction): Observable<any> {
    const o = Observable.create( obs => {
      this._transactions.delete(transaction.uuid);
      this._transactionsChangedSubject.next([transaction]);

      if (this._editedTransaction === transaction) {
        this._editedTransactionSubject.next(undefined);
      }
      obs.complete();
    });
    return Observable.concat(o, this.generateAccounts());
  }

  /****** Private ******/

  private getTransactionsUsingAccounts(accountsNames: string[]) {
    return Array.from(this._transactions.values()).filter(tr => {
      return tr.postings.some( p => accountsNames.indexOf(p.account) !== -1 );
    });
  }

  private allChildAccounts(root: Account): Account[] {
    const children = [root];
    root.children.forEach(c => children.push(...this.allChildAccounts(c)));
    return children;
  }

  private generateAccounts(): Observable<any> {
    return this.createAccountsFromTransactions()
      .do( accounts => {
        const root = new Account('ROOT');
        root.children = new Set(accounts);
        this._rootAccount = root;
        this._rootAccountSubject.next(this._rootAccount);

        /*
        let allAccounts = this.allChildAccounts(root)
        let selectedAccounts = Array.from(this._selectedAccounts)

        this._selectedAccounts = new Set(selectedAccounts.filter(a => allAccounts.some(a2 => {
          return a2.name == a.name
        })))
        this._selectedAccountsSubject.next(this._selectedAccounts)

        console.log(this._selectedAccounts)
        */
      });
  }

  private createAccountsFromTransactions(): Observable<Account[]> {
    return Observable.create( obs => {
      const flatAccounts = new Map();

      Array.from(this._transactions.values()).forEach(tr => {
          const transactionDate = this.getTransactionDate(tr);

          /*
          this._minDate =  this._minDate ? moment.min( this._minDate, transactionDate) : transactionDate;
          this._maxDate =  this._maxDate ? moment.max( this._maxDate, transactionDate) : transactionDate;
          */

          tr.postings.forEach(ps => {
              if (ps.currency) {
                  // this._currencies.add(ps.currency);
              }

              const accountParts = ps.account.split(':');
              let lastParent: Account | undefined;
              let currentAccountName = '';
              for (const part of accountParts) {
                  currentAccountName += part;
                  const account = this.getOrCreateAccount(currentAccountName, flatAccounts);
                  this.addAmountToAccount(account, ps.amount || new Decimal(0), currentAccountName === ps.account);

                  if (lastParent) {
                      lastParent.children.add(account);
                  }

                  lastParent = account;
                  currentAccountName += ':';
              }
          });
      });

      obs.next(this.topAccounts(flatAccounts));
      obs.complete();
    });
}

  private getOrCreateAccount(name: string, accounts: Map<string, Account>): Account {
    let stat = accounts.get(name);

    if (!stat) {
        stat = new Account(name);
        accounts.set(name, stat);
    }

    return stat;
  }

  private addAmountToAccount(a: Account, amount: decimal.Decimal, isFinalAccount: boolean) {
    if (!isFinalAccount) {
        a.childrenBalance = a.childrenBalance.plus(amount);
        a.nbChildrenTransactions ++;
        if (amount.greaterThan(0)) {
            a.childrenCredits = a.childrenCredits.plus(amount);
        } else {
            a.childrenDebits = a.childrenDebits.plus(amount);
        }
    } else {
        a.balance = a.balance.plus(amount);
        a.nbTransactions++;

        if (amount.greaterThan(0)) {
          a.credits = a.credits.plus(amount);
        } else {
            a.debits = a.debits.plus(amount);
        }
    }
  }

  private getTransactionDate(tr: Transaction): moment.Moment {
    return moment(tr.header.date, 'YYYY/MM/DD');
  }

  private topAccounts(accounts: Map<string, Account>): Account[] {
    return Array.from(accounts.values()).filter( a => a.name.indexOf(':') === -1).sort( (a1, a2) => a1.name.localeCompare(a2.name) );
  }

}
