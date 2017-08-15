import { Injectable } from '@angular/core';
import {Observable, BehaviorSubject, ReplaySubject, Subject} from 'rxjs'
import { Account, Transaction } from './models/models'
import * as moment from "moment";

@Injectable()
export class AppStateService {

  private _selectedAccounts: Set<Account> = new Set()
  private _rootAccount : Account
  private _transactions: Transaction[]

  private _selectedAccountsSubject: Subject<Set<Account>> = new BehaviorSubject (this._selectedAccounts)
  private _rootAccountSubject: Subject<Account> = new Subject()

  constructor() {   

  }

  selectedAccounts() : Observable<Set<Account>> {
     return this._selectedAccountsSubject.asObservable()
  }

  rootAccount(): Observable<Account> {
    return this._rootAccountSubject.asObservable()
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

  transactions(inAccounts: Set<Account>): Observable<Transaction[]> {
    return new Observable( obs => {

      if(this._transactions){
        let accountsNames = Array.from(inAccounts).map(a => a.name)
        let transactionsFiltered = this._transactions.filter(tr => {
          return tr.postings.some( p => accountsNames.indexOf(p.account) != -1 )
        })

        obs.next(transactionsFiltered)
      }
      obs.complete()
    })
  }

  setTransactions(tr: Transaction[]): Observable<any> {
    return new Observable( obs => {
      this._transactions = tr
      let accounts = this.getAccountsFromTransactions(tr)
      let root = new Account("ROOT")
      root.children = new Set(accounts);
      this._rootAccount = root
      this._rootAccountSubject.next(this._rootAccount)

      this._selectedAccounts = new Set()
      this._selectedAccountsSubject.next(this._selectedAccounts)

      obs.complete()
    })
  }

  private getAccountsFromTransactions(transactions: Transaction[]) : Account[] {
    let flatAccounts = new Map();
    
    transactions.forEach(tr => {

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
            let lastParent: Account;
            let currentAccountName: string = "";
            for (let part of accountParts) {
                currentAccountName += part;
                let account = this.getOrCreateAccount(currentAccountName, flatAccounts);
                this.addAmountToAccount(account, ps.amount, currentAccountName == ps.account);
                
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
