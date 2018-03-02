import {
  allTransactionsSelector,
  selectEditedTransaction,
  AppStateActions,
  canAutosearchSelector } from './../../shared/reducers/app-state-reducer';
import { AppState } from './../../shared/models/app-state';
import { NgRedux } from '@angular-redux/store';
import { DataSource } from '@angular/cdk/table';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, PageEvent } from '@angular/material';

import * as moment from 'moment';
import { filter } from 'rxjs/operators';
import 'rxjs/add/observable/concat';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { Transaction, TransactionWithUUID, isTransactionWithUUID } from '../../shared/models/transaction';
import { Posting } from '../../shared/models/posting';
import { Subject } from 'rxjs/Subject';
import { combineLatest } from 'rxjs/observable/combineLatest';
import 'rxjs/add/operator/skipUntil';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/first';
import 'rxjs/add/observable/merge';

import { selectedTransactionsSelector } from '../../shared/reducers/app-state-reducer';

const LEDGER_DATE_FORMAT = 'DD/MM/YYYY';

export class PostingRow {

  constructor(private _posting: Posting) {}

  get account() {
    return this._posting.account;
  }

  get amount() {
    return this._posting.amount;
  }

  get currency() {
    return this._posting.currency;
  }

}

export class TransactionRow {

    constructor(public transaction: TransactionWithUUID, private _selectedTransactionUUID: Observable<string>) {}

    get title() {
      return this.transaction.header.title;
    }

    get date() {
      return moment.unix(this.transaction.header.date).format(LEDGER_DATE_FORMAT);
    }

    get postings() {
      return this.transaction.postings.map(p => new PostingRow(p));
    }

    get isComplete() {
      return this.transaction.header.title !== undefined &&
      this.transaction.postings.length > 1;
    }

    get isSelected(): Observable<boolean> {
      return this._selectedTransactionUUID.map(uuid => this.transaction.uuid === uuid);
    }
  }

export class TransactionDataSource extends DataSource<TransactionRow> {

    constructor(
      private ngRedux: NgRedux<AppState>,
      private _paginator: MatPaginator,
      private _sort: MatSort,
      private _filter: ElementRef) {
      super();

      this._sort.active = 'date';
      this._sort.start = 'desc';
      this._sort.direction = 'desc';
    }

    /** Connect function called by the table to retrieve one stream containing the data to render. */
    connect(): Observable<TransactionRow[]> {

      const sortChange = Observable.from<MatSort>(this._sort.sortChange)
        .flatMap( d => this.ngRedux.select(selectedTransactionsSelector));

      const pageChange = Observable.from<PageEvent>(this._paginator.page)
        .flatMap( d => this.ngRedux.select(selectedTransactionsSelector));

      const keyUpFilter = Observable.fromEvent(this._filter.nativeElement, 'keyup')
        .debounceTime(200)
        .distinctUntilChanged()
        .do( f => this._paginator.pageIndex = 0)
        .flatMap( d => this.ngRedux.select(selectedTransactionsSelector));

      const selectedTransactionsChanged = this.ngRedux.select(selectedTransactionsSelector);

      const selectedUUID = this.ngRedux.select(selectEditedTransaction)
      .pipe(filter(t => isTransactionWithUUID(t)))
      .map(t => (t as TransactionWithUUID).uuid);

      return Observable.merge(pageChange, sortChange, keyUpFilter, selectedTransactionsChanged)
      .debounceTime(150)
      .map( data => this.filterData(this._filter.nativeElement.value, data) )
      .map( data => this.sortData(data))
      .map( data => {
        this._paginator.length = data.length;
        return this.paginateData(data);
      })
      .map( data => data.map( tr => new TransactionRow(tr, selectedUUID)));
    }

    disconnect() {}

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

    filterData(query: string, data: TransactionWithUUID[]): TransactionWithUUID[] {
      if (query !== undefined && query !== '' ) {
        return data.filter( tr => {
          const words = query.split(' ').filter(s => s !== '').map( s => s.toLowerCase());

          return words.some( word => {
            let titleMatches, amountOrAccountMatches = false;
            titleMatches = tr.header.title && tr.header.title.toLowerCase().indexOf(word) >= 0;
            amountOrAccountMatches = tr.postings.some( p => {
                return p.account.toLowerCase().indexOf(word) >= 0 || (p.amount !== undefined && p.amount.toString().indexOf(word) >= 0);
            });

            return titleMatches || amountOrAccountMatches;
          });
        });
      } else {
        return data;
      }
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

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('filter') filter: ElementRef;

  private onKeyDownSubject = new Subject();

  constructor(private ngRedux: NgRedux<AppState>) {
    this.transactions = ngRedux.select(allTransactionsSelector).map(t => Object.values(t));
   }

  ngOnInit() {
    this.dataSource = new TransactionDataSource(this.ngRedux, this.paginator, this.sort, this.filter);
    this.noTransactionsToDisplay = this.ngRedux.select(selectedTransactionsSelector)
    .map(t => t.length === 0);

    this.onKeyDownSubject.asObservable().flatMap(_ => this.ngRedux.select(canAutosearchSelector).take(1))
    .pipe(filter(a => a))
    .do(_ => this.filter.nativeElement.focus())
    .subscribe();
  }

  onTransactionClicked(row: TransactionRow) {
    this.ngRedux.dispatch(AppStateActions.setEditedTransaction(row.transaction));
  }

  @HostListener('document:keydown', ['$event']) onKeydownHandler(event: KeyboardEvent) {
    this.onKeyDownSubject.next();
  }
}
