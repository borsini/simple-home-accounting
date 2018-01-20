import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSidenav } from '@angular/material';
import * as fileSaver from 'file-saver';
import { AppStateService } from './shared/services/app-state/app-state.service';
import { LedgerService } from './shared/services/ledger/ledger.service';
import { Account } from './shared/models/account';
import { OfxService } from './shared/services/ofx/ofx.service';

import 'rxjs/add/operator/zip';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Transaction } from './shared/models/transaction';

const { version } = require('../../package.json');

@Component({
  selector: 'app-dialog-result-example-dialog',
  template: '<h2>Erreur</h2>{{ data }}',
})
export class DialogResultExampleDialogComponent {
  constructor(public dialogRef: MatDialogRef<DialogResultExampleDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {}
}

@Component({
  selector: 'app-dialog-two-options',
  template: `
  <h2 mat-dialog-title>{{ data.title }}</h2>
  <mat-dialog-content>{{ data.content }}</mat-dialog-content>
  <mat-dialog-actions>
    <button mat-button [mat-dialog-close]="data.option1.key">{{ data.option1.value }}</button>
    <button mat-button [mat-dialog-close]="data.option2.key">{{ data.option2.value }}</button>
  </mat-dialog-actions>
  `,
})
export class DialogTwoOptionsDialogComponent {
  constructor(public dialogRef: MatDialogRef<DialogTwoOptionsDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {}
}

@Component({
  providers: [ LedgerService, OfxService],
  selector: 'app-root',
  styleUrls: ['./app.component.css'],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  private _flatAccounts: Map<String, Account>;
  private _openDrawer: Subject<boolean> = new BehaviorSubject(false);

  @ViewChild(MatSidenav) sidenav: MatSidenav;

  isLoading: boolean;
  disableDownloadButton: Observable<boolean>;
  title = 'app';
  appVersion: string;


  constructor(private _state: AppStateService, private _ledger: LedgerService, private _ofx: OfxService, public dialog: MatDialog) {
    this.isLoading = false;
    this._flatAccounts = new Map();

    this.appVersion = version;
  }

  ngOnInit() {
    const o = this._state.transactionsChangedHotObservable()
      .flatMap(obs => this._state.allTransactionsColdObservable());
    this.disableDownloadButton = Observable.concat(this._state.allTransactionsColdObservable(), o)
    .map(tr => tr.length === 0);

    this._openDrawer.subscribe( open => {
      if (open) {
        this.sidenav.open();
      } else {
        this.sidenav.close();
      }
    });
  }

  uploadFileOnChange(files: FileList) {
    this.isLoading = true;

    this.readAndParseTransactionsFromFile(files.item(0))
    .zip(this.userWantsToAppendTransactions())
    .flatMap(zip => this._state.addTransactionsColdObservable(zip[0], zip[1]))
    .subscribe(
      transactions => {},
      e => {
        this.openErrorDialog(e);
        this.isLoading = false;
      },
      () => {
        this.isLoading = false;
        this._openDrawer.next(true);
      },
    );
  }

  userWantsToAppendTransactions(): Observable<boolean> {
    return this._state.allTransactionsColdObservable()
      .map( tr => tr.length)
      .flatMap( count => {
        if (count > 0) {
          return new Observable( subscriber => {
            const dialogRef = this.dialog.open(DialogTwoOptionsDialogComponent, {
              data: {
                content: 'Que faire des transactions existantes ?',
                option1: {key: true, value: 'Les conserver'},
                option2: {key: false, value: 'Les remplacer'},
                title: 'Importation',
              },
            });
            dialogRef.afterClosed().subscribe(result => {
              if (result !== undefined) {
                subscriber.next(result);
              }
              subscriber.complete();
            });
          });
        } else {
          return Observable.of(false);
        }
      });
  }

  saveLedgerClicked() {
    this._state.allTransactionsColdObservable()
    .flatMap(tr => this._ledger.generateLedgerString(tr))
    .do(ledger => {
      const blob = new Blob([ledger], {type: 'text/plain;charset=utf-8'});
      fileSaver.saveAs(blob, 'accounts.ledger');
    })
    .subscribe();
  }

  private readAndParseTransactionsFromFile(file: File): Observable<Transaction[]> {
    const exploded = file.name.split('.');
    const ext = exploded[exploded.length - 1];

    if (ext === 'ledger') {
      return this.readFileObservable(file)
      .flatMap(content => this._ledger.parseLedgerString(content));
    } else if (ext === 'ofx') {
      return this.readFileObservable(file)
      .flatMap(content => this._ofx.parseOfxString(content));
    } else {
      return Observable.throw('Cette extension n\'est pas autorisée');
    }
  }

  private readFileObservable(file: File): Observable<string> {
    return new Observable( obs => {
      const reader = new FileReader();
      reader.addEventListener('load', function () {
        obs.next(reader.result as string);
        obs.complete();
      });

      reader.readAsText(file);
    });
  }

  private openErrorDialog(e: any) {
    const dialogRef = this.dialog.open(DialogResultExampleDialogComponent, {
      data: e,
    });
    dialogRef.afterClosed().subscribe(result => {
      // this.selectedOption = result;
    });
  }
}
