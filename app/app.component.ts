/// <reference path="app.ts"/>

import { Pipe, PipeTransform, Component } from '@angular/core';
import { LedgerService }        from './ledgerservice';

@Pipe({name: 'numberToArray'})
export class NumberToArray implements PipeTransform {
  transform(value, args:string[]) : any {
    let res = [];
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
  filename : string;
  ledger: LedgerService;
  accounts : Account[] = [];
  transactions : Transaction[] = [];
  selectedAccount: string;
  startDate: moment.Moment; 
  endDate: moment.Moment;

  sliceStart: number = 0;
  sliceEnd: number = 5;
  
  nbPage: number = 0;
  currentPage: number = 0;
  perPage: number = 100;

  constructor(ledger: LedgerService) {
    this.ledger = ledger;
  }

  startDateChanged(event){
    this.startDate = moment(event.target.value, "YYYY-MM-DD");
    this.refreshTransactions();
  }

  endDateChanged(event){
    this.endDate = moment(event.target.value, "YYYY-MM-DD");
    this.refreshTransactions();
  }

  onChange(event) {
    var files = event.srcElement.files;
    console.log(files);

    this.filename = files[0].name;

    this.ledger.openFile(files[0], 
      () => {
        this.accounts = this.ledger.allAccounts;
        this.refreshTransactions();
      });
  }

  onAccountChanged(account: string){
    this.selectedAccount = account;
    this.refreshTransactions();
  }

  onPageChanged(page: number){
    this.currentPage = page;
    this.refreshSlices();
  }

  refreshTransactions(){
    var t0 = performance.now();
    this.transactions = this.ledger.filterTransactions(this.selectedAccount, this.startDate, this.endDate);
    var t1 = performance.now();
    console.log("Call to getTransactions took " + (t1 - t0) + " milliseconds.");

    this.currentPage = 1;
    this.nbPage = Math.ceil(this.transactions.length / this.perPage);
    this.refreshSlices();
  }

  refreshSlices(){
    this.sliceStart = (this.currentPage - 1) * this.perPage;
    this.sliceEnd = this.sliceStart + this.perPage;
  }
}