/// <reference path="app.ts"/>

import { Component } from '@angular/core';
import { LedgerService }        from './ledgerservice';

@Component({
  selector: 'app-header',
  templateUrl: './templates/header.html'
})
export class HeaderComponent { 

  filename : string;
  ledger: LedgerService;

  constructor(ledger: LedgerService) {
    this.ledger = ledger;
  }

  onChange(event) {
    var files = event.srcElement.files;
    console.log(files);

    this.filename = files[0].name;

    this.ledger.openFile(files[0],
      tr => {
        console.log(tr);
      });
  }
} 

@Component({
  selector: 'app-content',
  templateUrl: './templates/content.html'
})
export class ContentComponent { 
  transactions : Transaction[] = [];

  constructor(ledger: LedgerService) {
    this.transactions = ledger.transactions;
  }
} 

@Component({
  selector: 'app-menu',
  templateUrl: './templates/menu.html',
  providers:  [ LedgerService ]
})
export class MenuComponent { 
  accounts : string[] = [];
  constructor(ledger: LedgerService) {
    this.accounts = ledger.accounts;
  }

} 

@Component({
  selector: 'my-app',
  templateUrl: './templates/app.html'
})
export class AppComponent { } 