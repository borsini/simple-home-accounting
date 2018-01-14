import { DataSource } from '@angular/cdk/table';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, PageEvent } from '@angular/material';

import * as moment from 'moment';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { AppStateService } from '../../shared/services/app-state/app-state.service';
import { Transaction } from '../../shared/models/transaction';
import { Posting } from '../../shared/models/posting';

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

    constructor(public transaction: Transaction, private _selectedTransaction: Observable<Transaction | undefined>) {}

    get title() {
      return this.transaction.header.title;
    }

    get date() {
      return this.transaction.header.date.format(LEDGER_DATE_FORMAT);
    }

    get postings() {
      return this.transaction.postings.map(p => new PostingRow(p));
    }

    get isComplete() {
      return this.transaction.header.title !== undefined &&
      this.transaction.postings.length > 1;
    }

    get isSelected(): Observable<boolean> {
      return this._selectedTransaction.map(tr => this.transaction === tr);
    }
  }

export class TransactionDataSource extends DataSource<TransactionRow> {

    constructor(private _state: AppStateService, private _paginator: MatPaginator, private _sort: MatSort, private _filter: ElementRef) {
      super();

      this._sort.active = 'date';
      this._sort.start = 'desc';
      this._sort.direction = 'desc';
    }

    /** Connect function called by the table to retrieve one stream containing the data to render. */
    connect(): Observable<TransactionRow[]> {

      const sortChange = Observable.from<MatSort>(this._sort.sortChange)
        .flatMap( d => this._state.selectedTransactionsHotObservable());

      const pageChange = Observable.from<PageEvent>(this._paginator.page)
        .flatMap( d => this._state.selectedTransactionsHotObservable());

      const filter = Observable.fromEvent(this._filter.nativeElement, 'keyup')
        .debounceTime(200)
        .distinctUntilChanged()
        .do( f => this._paginator.pageIndex = 0)
        .flatMap( d => this._state.selectedTransactionsHotObservable());

      const selectedTransactionsChanged = this._state.selectedTransactionsHotObservable();

      return Observable.merge(pageChange, sortChange, filter, selectedTransactionsChanged)
      .debounceTime(150)
      .map( data => this.filterData(this._filter.nativeElement.value, data) )
      .map( data => this.sortData(data))
      .map( data => {
        this._paginator.length = data.length;
        return this.paginateData(data);
      })
      .map( data => data.map( tr => new TransactionRow(tr, this._state.editedTransactionHotObservable())));
    }

    disconnect() {}

    paginateData(data: Transaction[]): Transaction[] {
      const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
      return data.splice(startIndex, this._paginator.pageSize);
    }

    sortData(data: Transaction[]): Transaction[] {
      if (!this._sort.active || this._sort.direction === '') { return data; }

      return data.sort((a, b) => {
        let propertyA: string | moment.Moment = '';
        let propertyB: string | moment.Moment = '';

        switch (this._sort.active) {
          case 'title': [propertyA, propertyB] = [a.header.title, b.header.title]; break;
          case 'date': [propertyA, propertyB  ] = [a.header.date, b.header.date]; break;
        }

        const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
        const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

        return (valueA < valueB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1);
      });
    }

    filterData(query: string, data: Transaction[]): Transaction[] {
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
  dataSource: TransactionDataSource;
  displayedColumns = ['title', 'date', 'movements', 'status'];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('filter') filter: ElementRef;

  constructor(private _state: AppStateService) {
    this.transactions = _state.selectedTransactionsHotObservable();
   }

  ngOnInit() {
    this.dataSource = new TransactionDataSource(this._state, this.paginator, this.sort, this.filter);
  }

  onTransactionClicked(row: TransactionRow) {
    this._state.setEditedTransactionColdObservable(row.transaction).subscribe();
  }
}