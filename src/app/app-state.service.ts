import { Injectable } from '@angular/core';
import { v4 as uuid } from 'uuid';
import {Observable, BehaviorSubject, ReplaySubject, Subject} from 'rxjs'
import { Account, Transaction } from './models/models'
import * as moment from "moment";

@Injectable()
export class AppStateService {

  private _selectedAccounts: Set<Account> = new Set()
  private _rootAccount : Account
  private _editedTransaction?: Transaction
  private _transactions: Map<string, Transaction> = new Map()

  private _selectedAccountsSubject: Subject<Set<Account>> = new BehaviorSubject (this._selectedAccounts)
  private _rootAccountSubject: Subject<Account | undefined> = new BehaviorSubject(undefined)
  private _editedTransactionSubject: Subject<Transaction | undefined> = new BehaviorSubject(undefined)
  private _transactionChangeSubject: Subject<Transaction> = new Subject()

  private getTransactionsUsingAccounts(accountsNames : string[]) {
    return Array.from(this._transactions.values()).filter(tr => {
      return tr.postings.some( p => accountsNames.indexOf(p.account) != -1 )
    })
  }

  selectedAccounts() : Observable<Set<Account>> {
     return this._selectedAccountsSubject.asObservable()
  }

  selectedTransactions(): Observable<Transaction[]> {

    let modif = this._transactionChangeSubject.flatMap( change => this._selectedAccountsSubject )
    let accounts = this._selectedAccountsSubject
    
    return Observable.merge(accounts, modif)
    .map( accounts => {
        let accountsNames = Array.from(accounts).map(a => a.name)
        return this.getTransactionsUsingAccounts(accountsNames)
      })
  }

  rootAccount(): Observable<Account | undefined> {
    return this._rootAccountSubject.asObservable()
  }

  editedTransaction(): Observable<Transaction | undefined> {
    return this._editedTransactionSubject.asObservable()
  }

  setEditedTransaction(transaction?: Transaction): Observable<any> {
    return new Observable( obs => {
      this._editedTransaction = transaction
      this._editedTransactionSubject.next(this._editedTransaction)
      obs.complete()
    })
  }

  selectAccounts(isSelected: boolean, accounts: Account[]) : Observable<any> {
    return new Observable( obs => {
      if(isSelected){
        accounts.forEach( a => this._selectedAccounts.add(a) )
      }
      else{
        accounts.forEach( a => this._selectedAccounts.delete(a) )
      }
      
      this._selectedAccountsSubject.next(this._selectedAccounts)

      obs.complete()
    });
  }

  allAccountsFlattened(): Observable<Account[]> {
    return this._rootAccountSubject.flatMap( root => Observable.of(root ? this.allChildAccounts(root) : []))
  }

  private allChildAccounts(root: Account): Account[] {
    let children = [root]
    root.children.forEach(c => children.push(...this.allChildAccounts(c)))
    return children
  }

  allTransactions() : Observable<Transaction[]> { 
    return Observable.of(Array.from(this._transactions.values()))
  }

  setTransactions(transactions: Transaction[], append: boolean): Observable<any> {
    return new Observable( obs => {
      
      if(!append){
        this._transactions.clear()
      }

      transactions.forEach(tr => {
        tr.uuid = uuid()
        this._transactions.set(tr.uuid, tr)
      })

      this.refreshAccountsFromTransactions()

      this._selectedAccounts = new Set()
      this._selectedAccountsSubject.next(this._selectedAccounts)

      obs.complete()
    })
  }

  private refreshAccountsFromTransactions() {
    let accounts = this.getAccountsFromTransactions()
    let root = new Account("ROOT")
    root.children = new Set(accounts);
    this._rootAccount = root
    this._rootAccountSubject.next(this._rootAccount)
  }

  createOrUpdateTransaction(transaction: Transaction) : Observable<any> {
    return new Observable( obs => {
      if(!transaction.uuid){
        transaction.uuid = uuid()
      }
      this._transactions.set(transaction.uuid, transaction)

      this.refreshAccountsFromTransactions()
      this._transactionChangeSubject.next(transaction)

      obs.complete()
    })
  }

  deleteTransaction(transaction) : Observable<any> {
    return new Observable( obs => {
      this._transactions.delete(transaction.uuid)
      this.refreshAccountsFromTransactions()
      this._transactionChangeSubject.next(transaction)

      if(this._editedTransaction == transaction){
        this._editedTransactionSubject.next(undefined)
      }

      obs.complete()
    })
  }

  private getAccountsFromTransactions() : Account[] {
    let flatAccounts = new Map();
    
    Array.from(this._transactions.values()).forEach(tr => {

        let transactionDate = this.getTransactionDate(tr);

        /*
        this._minDate =  this._minDate ? moment.min( this._minDate, transactionDate) : transactionDate;
        this._maxDate =  this._maxDate ? moment.max( this._maxDate, transactionDate) : transactionDate;
*/
        tr.postings.forEach(ps => {
            if(ps.currency){
                //this._currencies.add(ps.currency);
            }

            let accountParts = ps.account.split(":");
            let lastParent: Account | undefined;
            let currentAccountName: string = "";
            for (let part of accountParts) {
                currentAccountName += part;
                let account = this.getOrCreateAccount(currentAccountName, flatAccounts);
                this.addAmountToAccount(account, ps.amount || 0, currentAccountName == ps.account);
                
                if(lastParent){
                    lastParent.children.add(account);
                }

                lastParent = account;
                currentAccountName += ":";
            }
        });
    });

    return this.topAccounts(flatAccounts)
}

  private getOrCreateAccount(name : string, accounts: Map<string, Account>) : Account {
    let stat = accounts.get(name);
    
    if(!stat){
        stat = new Account(name);
        accounts.set(name, stat);
    }

    return stat;           
  }

  private addAmountToAccount(a: Account, amount: number, isFinalAccount: boolean) {
  if(!isFinalAccount){
      a.childrenBalance += amount
      a.nbChildrenTransactions ++
      if(amount > 0){
          a.childrenCredits += amount
      }
      else{
          a.childrenDebits += amount
      }
  }
  else{
      a.balance += amount
      a.nbTransactions++
      if(amount > 0){
          a.credits += amount
      }
      else{
          a.credits += amount
      }
  }
  }

  private getTransactionDate(tr: Transaction) : moment.Moment {
    return moment(tr.header.date, "YYYY/MM/DD");
  }

  private topAccounts(accounts : Map<string, Account>): Account[] {
  return Array.from(accounts.values()).filter( a => a.name.indexOf(':') == -1).sort( (a1, a2) => a1.name.localeCompare(a2.name) )
  }

}
