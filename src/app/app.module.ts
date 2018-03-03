import { CdkTableModule } from '@angular/cdk/table';
import { NgModule, isDevMode } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  DateAdapter, MAT_DATE_FORMATS, MatAutocompleteModule, MatButtonModule, MatCardModule, MatCheckboxModule, MatDatepickerModule,
  MatIconModule,
  MatDialogModule,
  MatFormFieldModule,
  MatInputModule,
  MatNativeDateModule,
  MatPaginatorModule,
  MatProgressSpinnerModule,
  MatSidenavModule,
  MatSortModule,
  MatTableModule,
  MatToolbarModule,
} from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AccountTreeComponent } from './components/account-tree/account-tree.component';
import { AppComponent, DialogResultExampleDialogComponent, DialogTwoOptionsDialogComponent } from './app.component';

import { EditTransactionComponent } from './components/edit-transaction/edit-transaction.component';
import { MenuDrawerComponent } from './components/menu-drawer/menu-drawer.component';
import { TransactionsComponent } from './components/transactions/transactions.component';
import { MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { NgReduxModule, NgRedux, DevToolsExtension } from '@angular-redux/store';
import { AppState, TransactionMap } from './shared/models/app-state';
import { rootReducer, INITIAL_STATE, AppStateActions, allTransactionsSelector } from './shared/reducers/app-state-reducer';

import { undoRedoReducer, UndoRedoState, presentSelector } from './shared/reducers/undo-redo-reducer';
import { FiltersComponent } from './components/filters/filters.component';

@NgModule({
  bootstrap: [AppComponent],
  declarations: [
    AppComponent,
    AccountTreeComponent,
    MenuDrawerComponent,
    TransactionsComponent,
    DialogResultExampleDialogComponent,
    DialogTwoOptionsDialogComponent,
    EditTransactionComponent,
    FiltersComponent,
  ],
  entryComponents: [
    DialogResultExampleDialogComponent,
    DialogTwoOptionsDialogComponent,
  ],
  imports: [
    BrowserModule,
    MatButtonModule,
    MatCheckboxModule,
    MatToolbarModule,
    MatSidenavModule,
    CdkTableModule,
    MatTableModule,
    MatPaginatorModule,
    BrowserAnimationsModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatNativeDateModule,
    MatCardModule,
    NgReduxModule,
  ],
  providers : [
    {provide: DateAdapter, useClass: MomentDateAdapter},
    {provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS},
  ],
})
export class AppModule {
  constructor(
    private ngRedux: NgRedux<UndoRedoState<AppState>>,
    private devTools: DevToolsExtension,
  ) {
    this.ngRedux.configureStore(
      undoRedoReducer<AppState>(rootReducer, [
        AppStateActions.ADD_TRANSACTIONS,
        AppStateActions.DELETE_TRANSACTION,
        AppStateActions.UPDATE_TRANSACTION,
      ]),
      {
       past: [],
       present: INITIAL_STATE,
       future: [],
      },
      [],
      isDevMode() && devTools.isEnabled() ? [devTools.enhancer()] : []);

    this.ngRedux.select(presentSelector(allTransactionsSelector))
    .distinctUntilChanged()
    .debounceTime(5000)
    .subscribe( transactions => {
      console.log('save');
      saveTransactions(transactions);
    });

    const t = loadTransactions();
    if (t) {
      console.log('restore');
      this.ngRedux.dispatch(AppStateActions.addTransactions(Object.values(t), true));
    }
  }
}

const loadTransactions = (): TransactionMap | undefined => {
  const serializedTransactions = localStorage.getItem('transactions');

  if (serializedTransactions != null) {
    const loaded = JSON.parse(serializedTransactions);
    return loaded;
  }

  return undefined;
};

const saveTransactions = (transactions: TransactionMap) => {
  const serializedTransactions = JSON.stringify(transactions);
  localStorage.setItem('transactions', serializedTransactions);
};
