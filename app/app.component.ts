/// <reference path="app.ts"/>

import { Pipe, PipeTransform, Component } from '@angular/core';
import { LedgerService }        from './ledgerservice';
declare var saveAs:any;

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
  accounts : AccountStat[] = []
  transactions : Transaction[] = []
  selectedAccount: AccountStat
  startDate: moment.Moment
  endDate: moment.Moment
  tagFilter = ""

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

  uploadLedgerOnChange(event) {
    var files = event.srcElement.files;
    console.log(files);

    this.filename = files[0].name;

    this.ledger.openLedgerFile(files[0], 
      () => {
        this.accounts = this.ledger.stats;
        this.refreshTransactions();
      });
  }

  uploadOfxOnChange(event) {
    var files = event.srcElement.files;
    console.log(files);

    this.filename2 = files[0].name;

    this.ledger.openOfxFile(files[0], 
      () => {
        console.log('ofx loaded');
        this.accounts = this.ledger.stats;
        this.refreshTransactions();
      });
  }

  onAccountChanged(account: AccountStat){
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
  }

  refreshSlices(){
    this.sliceStart = (this.currentPage - 1) * this.perPage;
    this.sliceEnd = this.sliceStart + this.perPage;
  }
}