import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSidenav, MatTabGroup } from '@angular/material';
import * as fileSaver from 'file-saver';
import { LedgerService } from './shared/services/ledger/ledger.service';
import { OfxService } from './shared/services/ofx/ofx.service';

import 'rxjs/add/operator/zip';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Transaction, TransactionWithUUID } from './shared/models/transaction';
import { GnucashService } from './shared/services/gnucash/gnucash.service';
import { NgRedux } from '@angular-redux/store';
import { AppState, Tab, AccountMap, TransactionMap } from './shared/models/app-state';
import {
  AppStateActions } from './shared/reducers/app-state-reducer';
import {
  allTransactionsSelector,
  isLeftMenuOpenSelector,
  isLoadingSelector,
  invalidTransactionsSelector,
  allAccountsSelector,
  tabsSelector,
} from './shared/selectors/selectors';

const { version } = require('../../package.json');
import * as moment from 'moment';
import { UndoRedoState, presentSelector, pastSelector, futureSelector, UndoRedoActions } from './shared/reducers/undo-redo-reducer';
import { filter, concatMap, mergeMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs/observable/combineLatest';

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

interface TabConfiguration {
  isClosable: boolean;
  tabId: string;
  title: string;
}

@Component({
  providers: [ LedgerService, OfxService, GnucashService],
  selector: 'app-root',
  styleUrls: ['./app.component.css'],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  private _flatAccounts: Map<String, Account>;

  isLoading: Observable<boolean>;
  showDownloadButton: Observable<boolean>;
  showResetButton: Observable<boolean>;
  nbUndosAvailable: Observable<number>;
  nbRedosAvailable: Observable<number>;
  isDrawerOpen: Observable<boolean>;
  appVersion: string;
  tabsConf: Observable<TabConfiguration[]>;

  allTransactionsCount: Observable<number>;

  @ViewChild(MatTabGroup) tabGroup: MatTabGroup;

  computeTitle = (tab: Tab, allAccounts: AccountMap, allTransactions: TransactionMap) => {
    if (tab.selectedAccounts.length === 1 && tab.selectedAccounts[0] === 'ROOT') {
      return `Toutes les transactions (${Object.keys(allTransactions).length})`;
    }

    return `${tab.selectedAccounts.join(',')} (${allAccounts[tab.selectedAccounts[0]].balance})`;
  }

  constructor(
    private _ledger: LedgerService,
    private _ofx: OfxService,
    private _gnucash: GnucashService,
    public dialog: MatDialog,
    private ngRedux: NgRedux<UndoRedoState<AppState>>) {
    this._flatAccounts = new Map();
    this.appVersion = version;
  }

  ngOnInit() {
    this.showDownloadButton = this.ngRedux.select(presentSelector(allTransactionsSelector)).zip(
      this.ngRedux.select(presentSelector(invalidTransactionsSelector)))
      .map(zip => Object.keys(zip[0]).length > 0 && zip[1].length === 0);

    this.showResetButton = this.ngRedux.select(presentSelector(allTransactionsSelector))
    .map(trs => Object.keys(trs).length > 0);

    const t = pastSelector(this.ngRedux.getState());
    this.nbUndosAvailable = this.ngRedux.select<AppState[]>(pastSelector).map(p => p.length);
    this.nbRedosAvailable = this.ngRedux.select<AppState[]>(futureSelector).map(p => p.length);

    this.isDrawerOpen = this.ngRedux.select(presentSelector(isLeftMenuOpenSelector));
    this.isLoading = this.ngRedux.select(presentSelector(isLoadingSelector));

    this.allTransactionsCount = this.ngRedux.select(presentSelector(allTransactionsSelector)).map(trs => Object.keys(trs).length);

    const tabs = this.ngRedux.select(presentSelector(tabsSelector));
    const allAccounts = this.ngRedux.select(presentSelector(allAccountsSelector));
    const allTransactions = this.ngRedux.select(presentSelector(allTransactionsSelector));

    this.tabsConf = combineLatest(tabs, allAccounts, allTransactions)
    .map(([tbs, acc, trs]) => {
      return Object.values(tbs).map<TabConfiguration>(tb => ({
        isClosable: tb.isClosable,
        tabId: tb.id,
        title: this.computeTitle(tb, acc, trs),
      }));
    });
  }

  trackByFn(index, item: TabConfiguration) {
    return item.tabId; // or item.id
  }

  closeTabClicked(tab: string) {
    this.ngRedux.dispatch(AppStateActions.closeTab(tab));
  }

  uploadFileOnChange(files: FileList) {
    this.ngRedux.dispatch(AppStateActions.setIsLoading(true));

    this.readAndParseTransactionsFromFile(files.item(0))
      .zip(this.userWantsToClearOldTransactions())
      .subscribe(
      zip => {
        this.ngRedux.dispatch(AppStateActions.addTransactions(zip[0], zip[1]));
      },
      e => {
        this.openErrorDialog(e);
        this.ngRedux.dispatch(AppStateActions.setIsLoading(false));
      },
      () => {
        this.ngRedux.dispatch(AppStateActions.setIsLoading(false));
      },
    );
  }

  userWantsToClearOldTransactions(): Observable<boolean> {
    return this.ngRedux.select(presentSelector(allTransactionsSelector)).take(1)
      .map( tr => Object.keys(tr).length)
      .flatMap( count => {
        if (count > 0) {
          return new Observable( subscriber => {
            const dialogRef = this.dialog.open(DialogTwoOptionsDialogComponent, {
              data: {
                content: 'Que faire des transactions existantes ?',
                option1: {key: false, value: 'Les conserver'},
                option2: {key: true, value: 'Les remplacer'},
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
    this.ngRedux.select(presentSelector(allTransactionsSelector))
    .take(1)
    .flatMap(tr => this._ledger.generateLedgerString(Object.values(tr)))
    .do(ledger => {
      const blob = new Blob([ledger], {type: 'text/plain;charset=utf-8'});
      fileSaver.saveAs(blob, 'accounts.ledger');
    })
    .subscribe();
  }

  undoClicked() {
    this.ngRedux.dispatch(UndoRedoActions.undo());
  }

  redoClicked() {
    this.ngRedux.dispatch(UndoRedoActions.redo());
  }

  resetClicked() {
    this.ngRedux.dispatch(AppStateActions.addTransactions([], true));
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
    } else if (ext === 'gnucash') {
      return this.readFileObservable(file)
        .flatMap(content => this._gnucash.parseGnucashString(content));
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
