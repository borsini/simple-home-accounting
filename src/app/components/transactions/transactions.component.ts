
import {merge as observableMerge,  Observable ,  Subject, from } from 'rxjs';

import {tap, debounceTime, map,  filter, flatMap } from 'rxjs/operators';
import { AppStateActions } from './../../shared/reducers/app-state-reducer';
import { AppState } from './../../shared/models/app-state';
import { NgRedux } from '@angular-redux/store';
import { DataSource } from '@angular/cdk/table';
import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { MatPaginator, MatSort, PageEvent } from '@angular/material';
import Decimal from 'decimal.js';
import * as moment from 'moment';
import { Transaction, TransactionWithUUID, isTransactionWithUUID } from '../../shared/models/transaction';
import { Posting } from '../../shared/models/posting';






import {
  allTransactionsSelector,
  editedTransactionSelector,
  invalidTransactionsSelector,
  selectedAccountsSelector,
  selectedTransactionsSelector,
  filtersSelector,
} from '../../shared/selectors/selectors';
import { UndoRedoState, presentSelector } from '../../shared/reducers/undo-redo-reducer';

const LEDGER_DATE_FORMAT = 'DD/MM/YYYY';

export class PostingRow {

  private decimalAmount: Decimal;

  constructor(private _posting: Posting, private _handleAccountClicked: (a: string) => void) {
    this.decimalAmount = new Decimal(this._posting.amount || 0);
  }

  get account() {
    return this._posting.account;
  }

  get amount() {
    return this.decimalAmount.toFixed(2);
  }

  get currency() {
    return this._posting.currency;
  }

  get isPositive() {
    return new Decimal(this._posting.amount || 0).isPositive();
  }

  handleAccountClick() {
    this._handleAccountClicked(this._posting.account);
  }
}

export class TransactionRow {

    constructor(
      public transaction: TransactionWithUUID,
      private _selectedTransactionUUID: Observable<string>,
      private invalidTransactions: Observable<string[]>,
      private selectedAccounts: Observable<string[]>,
      private _handleAccountClicked: (a: string) => void) {}

    get title() {
      return this.transaction.header.title;
    }

    get date() {
      return moment.unix(this.transaction.header.date).format(LEDGER_DATE_FORMAT);
    }

    inverseAmount(p: Posting): Posting {
      return {
        ...p,
        amount: p.amount && new Decimal(p.amount).neg().toString(),
      };
    }

    postingsToDisplay(selectedAccounts: string[]): Posting[] {
      if (selectedAccounts.length === 1 && selectedAccounts[0] !== 'ROOT') {
        const postingsWithoutSameAccount = this.transaction.postings.filter( p => p.account !== selectedAccounts[0]);
        if (postingsWithoutSameAccount) {
          return postingsWithoutSameAccount.map(this.inverseAmount);
        }
      }

      return this.transaction.postings;
    }

    get postings(): Observable<PostingRow[]> {
      return this.selectedAccounts.pipe(map(sa => {
        return this.postingsToDisplay(sa).map(p => new PostingRow(p, this._handleAccountClicked));
      }));
    }

    get isInvalid(): Observable<boolean> {
      return this.invalidTransactions.pipe(map(trs => trs.includes(this.transaction.uuid)));
    }

    get isSelected(): Observable<boolean> {
      return this._selectedTransactionUUID.pipe(map(uuid => this.transaction.uuid === uuid));
    }

    get headerTags(): string[] {
      return this.transaction.header.tags;
    }

    get isVerified(): boolean {
      return this.transaction.header.isVerified;
    }
  }

export class TransactionDataSource extends DataSource<TransactionRow> {

    constructor(
      private ngRedux: NgRedux<UndoRedoState<AppState>>,
      private tabId: string,
      private _paginator: MatPaginator,
      private _sort: MatSort) {
      super();

      this._sort.active = 'date';
      this._sort.start = 'desc';
      this._sort.direction = 'desc';
    }

    /** Connect function called by the table to retrieve one stream containing the data to render. */
    connect(): Observable<TransactionRow[]> {

      const selectedTransactionsSel = selectedTransactionsSelector(this.tabId);
      const editedTransactionSel = editedTransactionSelector(this.tabId);
      const selectedAccountsSel = selectedAccountsSelector(this.tabId);

      const sortChange = from(this._sort.sortChange)
        .pipe(flatMap( d => this.ngRedux.select(presentSelector(selectedTransactionsSel))));

      const pageChange = from(this._paginator.page)
        .pipe(flatMap( d => this.ngRedux.select(presentSelector(selectedTransactionsSel))));

      const selectedTransactionsChanged = this.ngRedux.select(presentSelector(selectedTransactionsSel));

      const selectedUUID = this.ngRedux.select(presentSelector(editedTransactionSel))
      .pipe(filter(t => isTransactionWithUUID(t))).pipe(
      map(t => (t as TransactionWithUUID).uuid));

      const invalidTransactions = this.ngRedux.select(presentSelector(invalidTransactionsSelector));
      const selectedAccounts = this.ngRedux.select(presentSelector(selectedAccountsSel));
      return observableMerge(pageChange, sortChange, selectedTransactionsChanged).pipe(
      debounceTime(150),
      map( data => this.sortData(data)),
      map( data => {
        this._paginator.length = data.length;
        return this.paginateData(data);
      }),
      map( data => data.map( tr => new TransactionRow(
        tr,
        selectedUUID,
        invalidTransactions,
        selectedAccounts,
        this.handleAccountClicked,
      ))),);
    }

    disconnect() {}

    handleAccountClicked = (account: string ) => {
      this.ngRedux.dispatch(AppStateActions.openTab([account]));
    }

    paginateData(data: TransactionWithUUID[]): TransactionWithUUID[] {
      const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
      return data.splice(startIndex, this._paginator.pageSize);
    }

    sortData(data: TransactionWithUUID[]): TransactionWithUUID[] {
      if (!this._sort.active || this._sort.direction === '') { return data; }

      return data.sort((a, b) => {
        let propertyA: string | number = '';
        let propertyB: string | number = '';

        switch (this._sort.active) {
          case 'title': [propertyA, propertyB] = [a.header.title, b.header.title]; break;
          case 'date': [propertyA, propertyB  ] = [a.header.date, b.header.date]; break;
        }

        const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
        const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

        return (valueA < valueB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1);
      });
    }
  }

@Component({
  selector: 'app-transactions',
  styleUrls: ['./transactions.component.css'],
  templateUrl: './transactions.component.html',
})
export class TransactionsComponent implements OnInit {

  transactions: Observable<Transaction[]>;
  noTransactionsToDisplay: Observable<boolean>;
  dataSource: TransactionDataSource;
  displayedColumns = ['title', 'date', 'movements', 'status'];

  @Input() tabId: string;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private ngRedux: NgRedux<UndoRedoState<AppState>>) {
    this.transactions = ngRedux.select(presentSelector(allTransactionsSelector)).pipe(map(t => Object.values(t)));
  }

  ngOnInit() {
    this.dataSource = new TransactionDataSource(this.ngRedux, this.tabId, this.paginator, this.sort);
    this.noTransactionsToDisplay = this.ngRedux.select(presentSelector(selectedTransactionsSelector(this.tabId))).pipe(
    map(t => t.length === 0));

    this.ngRedux.select(presentSelector(filtersSelector(this.tabId))).pipe(tap(_ => {
      this.paginator.pageIndex = 0;
    })).subscribe();
  }

  onTransactionClicked(row: TransactionRow) {
    this.ngRedux.dispatch(AppStateActions.setEditedTransaction(row.transaction, this.tabId));
  }

  toggleCheck(row: TransactionRow) {
    console.log(row.transaction);

    const modifiedTransaction = {
      ...row.transaction,
      header: {
        ...row.transaction.header,
        isVerified: !row.transaction.header.isVerified,
      },
    };

    console.log(modifiedTransaction);
    this.ngRedux.dispatch(AppStateActions.updateTransaction(modifiedTransaction));
  }
}
