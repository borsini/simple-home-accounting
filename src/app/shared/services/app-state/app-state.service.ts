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
import { Transaction, TransactionWithUUID } from '../../models/transaction';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/concat';
import 'rxjs/add/observable/from';

const ROOT_ACCOUNT = 'ROOT';

@Injectable()
export class AppStateService {

  private _selectedAccounts: Set<Account> = new Set();
  private _rootAccount: Account = new Account(ROOT_ACCOUNT);
  private _editedTransaction?: TransactionWithUUID;
  private _transactions: Map<string, TransactionWithUUID> = new Map();
  private _selectedAccountsSubject: Subject<Set<Account>> = new BehaviorSubject (this._selectedAccounts);
  private _rootAccountSubject: Subject<Account | undefined> = new BehaviorSubject(undefined);
  private _editedTransactionSubject: Subject<TransactionWithUUID | undefined> = new BehaviorSubject(undefined);
  private _transactionsChangedSubject: Subject<TransactionWithUUID[]> = new Subject();

  /****** HOT OBSERVABLES ******/

  selectedAccountsHotObservable(): Observable<Set<Account>> {
     return this._selectedAccountsSubject.asObservable().do( a => console.log("SIZE " + a.size));
  }

  selectedTransactionsHotObservable(): Observable<TransactionWithUUID[]> {
    const modif = this._transactionsChangedSubject.flatMap( () => {
      console.log('EUUUUUH');
      return this._selectedAccountsSubject;
    } );
    const selectedAccounts = this._selectedAccountsSubject.do(t => console.log('uh'));

    return Observable.merge(selectedAccounts, modif)
    .map( accounts => {
      console.log(accounts);
        const accountsNames = Array.from(accounts).map(a => a.name);
        const t =  this.getTransactionsUsingAccounts(accountsNames);
        console.log(t);
        return t;
      });
  }

  rootAccountHotObservable(): Observable<Account | undefined> {
    return this._rootAccountSubject.asObservable();
  }

  editedTransactionHotObservable(): Observable<TransactionWithUUID | undefined> {
    return this._editedTransactionSubject.asObservable();
  }

  allAccountsFlattenedHotObservable(): Observable<Account[]> {
    return this._rootAccountSubject.flatMap( root => Observable.of(root ? [root, ...this.allChildAccounts(root)] : []));
  }

  transactionsChangedHotObservable(): Observable<TransactionWithUUID[]> {
    return this._transactionsChangedSubject.asObservable();
  }

  /****** COLD OBSERVABLES ******/

  setEditedTransactionColdObservable(transaction?: TransactionWithUUID): Observable<any> {
    return Observable.create( obs => {
      this._editedTransaction = transaction;
      this._editedTransactionSubject.next(this._editedTransaction);
      obs.complete();
    });
  }

  private selectAccountsColdObservable(isSelected: boolean, accounts: Account[], clearPrevious): Observable<any> {
    return Observable.create( obs => {
      console.log('SELECTTTTTTT');

      if (clearPrevious) {
        this._selectedAccounts.clear();
      }

      const children = accounts.map(a => this.allChildAccounts(a)).reduce( (a, b) => [...a, ...b], []);
      const accountsToSelect: Account[] = [...accounts, ...children];

      if (isSelected) {
        accountsToSelect.forEach( a => this._selectedAccounts.add(a) );
      } else {
        accountsToSelect.forEach( a => this._selectedAccounts.delete(a) );
      }

      const accountsCount = this.allChildAccounts(this._rootAccount).length;
      if (this._selectedAccounts.size === accountsCount && !this._selectedAccounts.has(this._rootAccount)) {
        this._selectedAccounts.add((this._rootAccount));
      } else if (this._selectedAccounts.size === 1 && this._selectedAccounts.has(this._rootAccount)) {
        this._selectedAccounts.delete(this._rootAccount);
      }

      this._selectedAccountsSubject.next(this._selectedAccounts);

      obs.complete();
    });
  }

  selectAccountColdObservable(isSelected: boolean, account: Account): Observable<any> {
    return this.selectAccountsColdObservable(isSelected, [account], false);
  }

  allTransactionsColdObservable(): Observable<TransactionWithUUID[]> {
    return Observable.of(Array.from(this._transactions.values()));
  }

  addOrUpdateTransactionsColdObservable(transactions: TransactionWithUUID[], append: boolean = true): Observable<any> {
    const o = Observable.create( obs => {
      if (!append) {
        this._transactions.clear();
      }
      transactions.forEach(tr => {
        this._transactions.set(tr.uuid, tr);
      });

      this._transactionsChangedSubject.next(transactions);

      obs.complete();
    });

    return Observable.concat(o, this.generateAccounts(), this.refreshSelectedAccounts());
  }

  deleteTransactionColdObservable(transaction: TransactionWithUUID): Observable<any> {
    const o = Observable.create( obs => {
      this._transactions.delete(transaction.uuid);
      this._transactionsChangedSubject.next([transaction]);

      if (this._editedTransaction === transaction) {
        this._editedTransactionSubject.next(undefined);
      }
      obs.complete();
    });
    return Observable.concat(o, this.generateAccounts(), this.refreshSelectedAccounts());
  }

  addTransactionsColdObservable(transactions: Transaction[], append: boolean = true): Observable<any> {
    return Observable.from(transactions)
      .map(this.addUUIDToTransaction)
      .toArray()
      .flatMap(tr => this.addOrUpdateTransactionsColdObservable(tr, append));
  }

  /****** Private ******/

  private getTransactionsUsingAccounts(accountsNames: string[]) {
    const allTransactions = Array.from(this._transactions.values());

    if (accountsNames.find(n => n === ROOT_ACCOUNT)) {
      return allTransactions;
    }

    return allTransactions
      .filter(tr => {
      return tr.postings.some( p => accountsNames.indexOf(p.account) !== -1 );
    });
  }

  private allChildAccounts(root: Account): Account[] {
    const children: Account[] = [];
    root.children.forEach(c => children.push(...[c, ...this.allChildAccounts(c)]));
    return children;
  }

  private generateAccounts(): Observable<any> {
    return this.createAccountsFromTransactions()
      .do( accounts => {
        const root = new Account(ROOT_ACCOUNT);
        root.children = new Set(accounts);
        this._rootAccount = root;
        this._rootAccountSubject.next(this._rootAccount);
      });
  }

  private refreshSelectedAccounts(): Observable<any> {
    return Observable.create( obs => {
      if (this._selectedAccounts.size > 0) {

        const previousSelectedAccounts = Array.from(this._selectedAccounts.values()).map(a => a.name);
        const newlySelectedAccounts = [this._rootAccount, ...this.allChildAccounts(this._rootAccount)]
          .filter(a => previousSelectedAccounts.includes(a.name));

        obs.next(newlySelectedAccounts);
      }
      obs.complete();
    }).flatMap(accounts => this.selectAccountsColdObservable(true, accounts, true));
  }

  private addMissingAmount(transaction: Transaction) {
    const t = transaction.postings.find(p => p.amount === undefined);

    if (!t) {
      return;
    }

    const sum = transaction.postings
      .filter(p => p.amount !== undefined)
      .map(p => p.amount)
      .reduce((a1, a2) => Decimal.add(a1!, a2!), new Decimal(0));

    t.amount = new Decimal(-sum!);
  }

  private createAccountsFromTransactions(): Observable<Account[]> {
    return Observable.create( obs => {
      const flatAccounts = new Map();

      Array.from(this._transactions.values()).forEach(tr => {
        this.addMissingAmount(tr);
          tr.postings.forEach(ps => {
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

  private getOrCreateAccount(name: string, accountsMap: Map<string, Account>): Account {
    let stat = accountsMap.get(name);

    if (!stat) {
        stat = new Account(name);
        accountsMap.set(name, stat);
    }

    return stat;
  }

  private addAmountToAccount(a: Account, amount: Decimal, isFinalAccount: boolean) {
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

  private topAccounts(accounts: Map<string, Account>): Account[] {
    return Array.from(accounts.values()).filter( a => a.name.indexOf(':') === -1).sort( (a1, a2) => a1.name.localeCompare(a2.name) );
  }

  private addUUIDToTransaction(transaction: Transaction): TransactionWithUUID {
    return {
      ...transaction,
      uuid: uuid(),
    };
  }
}
