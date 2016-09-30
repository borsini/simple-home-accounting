/// <reference path="app.ts"/>

import { Component } from '@angular/core';
import { LedgerService }        from './ledgerservice';

@Component({
  selector: 'my-app',
  templateUrl: './templates/app.html'
})
export class AppComponent { 
  filename : string;
  ledger: LedgerService;
  accounts : Account[] = [];
  transactions : Transaction[] = [];

  constructor(ledger: LedgerService) {
    this.ledger = ledger;
  }

  onChange(event) {
    var files = event.srcElement.files;
    console.log(files);

    this.filename = files[0].name;

    this.ledger.openFile(files[0], 
      () => {
        this.accounts = this.ledger.allAccounts;
        this.transactions = this.ledger.transactions;
      });
  }
} 