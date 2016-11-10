/// <reference path="app.ts"/>

import { Pipe, PipeTransform, Component, Input, Output, EventEmitter } from '@angular/core';
import { LedgerService }        from './ledgerservice';
import * as saveAs from 'file-saver';
import * as moment from "moment";

@Pipe({name: 'numberToArray'})
export class NumberToArray implements PipeTransform {
  transform(value, args:string[]) : any {
    let res : number[] = [];
    for (let i = 1; i <= value; i++) {
        res.push(i);
      }
      return res;
  }
}

@Component({
  selector: 'my-app',
  templateUrl: './templates/app.html'
})
export class AppComponent { 
  filename : string
  filename2 : string
  ledger: LedgerService
  rootAccount : Account;
  transactions : Transaction[] = []
  selectedAccount: Account
  startDate: moment.Moment
  endDate: moment.Moment
  tagFilter = ""
  transactionToAdd : Transaction;

  sliceStart: number = 0;
  sliceEnd: number = 5;
  
  nbPage: number = 0;
  currentPage: number = 0;
  perPage: number = 100;

  constructor(ledger: LedgerService) {
    this.ledger = ledger;
    this.rootAccount = new Account("Tous");
    this.startDate = moment().subtract(2, 'years')
    this.endDate = moment()
    this.transactionToAdd = {
      header : {
        date: moment().format("YYYY/MM/DD"),
        tag: null,
        title: null
      },
      postings : [
        {
          account: null,
          amount: 0,
          comment: null,
          currency: null,
          tag: null
        }
      ]
    }
  }

  startDateChanged(event){ 
    this.startDate = moment(event.target.value, "YYYY-MM-DD");
    this.refreshTransactions();
  }

  endDateChanged(event){
    this.endDate = moment(event.target.value, "YYYY-MM-DD");
    this.refreshTransactions(); 
  }

  uploadLedgerOnChange(files: FileList) {
    this.ledger.openLedgerFile(files.item(0), 
      () => {
        this.rootAccount.children = new Set(this.ledger.topAccounts);
        this.refreshTransactions();
      });
  }

  uploadOfxOnChange(files: FileList) {
    this.ledger.openOfxFile(files.item(0), 
      () => {
        console.log('ofx loaded');
        this.rootAccount.children = new Set(this.ledger.topAccounts);
        this.refreshTransactions();
      });
  }

  onAccountSelected(account: Account){
    this.selectedAccount = account;
    this.refreshTransactions();
  }

  onPageChanged(page: number){
    this.currentPage = page;
    this.refreshSlices();
  }

  onStatusChanged(e: Event){
    this.tagFilter = e.target.selectedOptions[0].value
    this.refreshTransactions()
  }

  onSaveClicked() {
    var blob = new Blob([this.ledger.getOutString()], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "accounts.ledger");
  }

  refreshTransactions(){
    var t0 = performance.now();
    this.transactions = this.ledger.filterTransactions(this.selectedAccount ? this.selectedAccount.name : "", this.startDate, this.endDate, this.tagFilter);
    var t1 = performance.now();
    console.log("Call to getTransactions took " + (t1 - t0) + " milliseconds.");

    this.currentPage = 1;
    this.nbPage = Math.ceil(this.transactions.length / this.perPage);
    this.refreshSlices();
    this.refreshStats();
  }

  refreshStats(){
    let periods = this.ledger.analyzeTransactions(
      this.selectedAccount,
      null,
      this.startDate,
      this.endDate,
      GroupBy.Account,
      StatParam.Sum,
      PeriodGap.None,
      1,
      TransactionType.BOTH,
      2
    );

    periods.forEach(period => {
      console.log(period.startDate + " " + period.endDate);

      period.stats.forEach((value, key) => {
        console.log(key + " -> " + value)
      })
    })
  }

  refreshSlices(){
    this.sliceStart = (this.currentPage - 1) * this.perPage;
    this.sliceEnd = this.sliceStart + this.perPage;
  }
}

@Component({
  selector: '[transaction]',
  templateUrl: './templates/transaction.html'
})
export class TransactionComponent {
  @Input()
  transaction: Transaction;
}

@Component({
  selector: 'posting',
  templateUrl: './templates/posting.html'
})
export class PostingComponent {
  @Input()
  posting: Posting;
}

@Component({
  selector: 'account-tree',
  templateUrl: './templates/account_tree.html'
})
export class AccountTreeComponent {
  @Input()
  account: Account;

  @Input()
  selectedAccount: Account;

  isCollapsed: boolean = false;
  
  @Input()
  isChecked: boolean;

  @Output()
  accountSelected = new EventEmitter<Account>();

  onAccountSelected(account: Account){
    this.accountSelected.emit(account);
  }

onAccountChecked(chk : boolean){
  this.isChecked = chk
}

  onChildSelected(account: Account){
    this.accountSelected.emit(account);
  }

  toggle(){
    this.isCollapsed = !this.isCollapsed;
  }
}