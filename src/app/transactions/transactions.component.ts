import { Component, OnInit, NgModule, ViewChild, ElementRef } from '@angular/core';
import { AsyncPipe } from '@angular/common'
import {DataSource} from '@angular/cdk';
import {MdPaginator, MdSort, Sort, PageEvent} from '@angular/material';

import { AppStateService } from '../app-state.service'
import { Transaction, Posting } from '../models/models'
import {Observable} from 'rxjs'


@Component({
  selector: 'transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent implements OnInit {

  transactions : Observable<Transaction[]>
  dataSource: TransactionDataSource;
  displayedColumns = ['title', 'date', 'movements', 'status'];

  @ViewChild(MdPaginator) paginator: MdPaginator;
  @ViewChild(MdSort) sort: MdSort;
  @ViewChild('filter') filter: ElementRef;

  constructor(private _state: AppStateService) {
    this.transactions = _state.selectedAccounts().flatMap(a => _state.transactions(a))
   }

  ngOnInit() {
    console.log(this.paginator)
    this.dataSource = new TransactionDataSource(this._state, this.paginator, this.sort, this.filter)
  }

}

export class PostingRow {

  constructor(private _posting: Posting){}
  
    get account() {
      return this._posting.account
    }
  
    get amount() {
      let value = this._posting.amount
      return (value < 0 ? '-' : '+') + Math.abs(value)
    }
  
}

export class TransactionRow {

  constructor(private _transaction: Transaction){}

  get title() {
    return this._transaction.header.title
  }

  get date() {
    return this._transaction.header.date
  }

  get postings() {
    return this._transaction.postings.map(p => new PostingRow(p))
  }

  get isComplete() {
    return this._transaction.header.title != undefined &&
    this._transaction.postings.length > 1
  }
}

export class TransactionDataSource extends DataSource<TransactionRow> {

  constructor(private _state : AppStateService, private _paginator: MdPaginator, private _sort: MdSort, private _filter: ElementRef) {
    super()
  }

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<TransactionRow[]> {

    let sortChange = Observable.from<MdSort>(this._sort.mdSortChange)
      .flatMap( d => this._state.selectedAccounts())
    
    let pageChange = Observable.from<PageEvent>(this._paginator.page)
      .flatMap( d => this._state.selectedAccounts())
    
    let filter = Observable.fromEvent(this._filter.nativeElement, 'keyup')
      .debounceTime(200)
      .distinctUntilChanged()
      .do( f => this._paginator.pageIndex = 0)
      .flatMap( d => this._state.selectedAccounts())

    let selectedAccountsChanged = this._state.selectedAccounts()

    return Observable.merge(pageChange, sortChange, filter, selectedAccountsChanged)
    .debounceTime(150)
    .flatMap( a => this._state.transactions(a))
    .map( data => this.filterData(this._filter.nativeElement.value, data) )
    .map( data => this.sortData(data))
    .map( data => {
      this._paginator.length = data.length
      return this.paginateData(data)
    })
    .map( data => data.map( tr => new TransactionRow(tr)))
  }

  disconnect() {}

  paginateData(data: Transaction[]): Transaction[] {
    const startIndex = this._paginator.pageIndex * this._paginator.pageSize
    return data.splice(startIndex, this._paginator.pageSize)
  }

  sortData(data: Transaction[]): Transaction[] {
    if (!this._sort.active || this._sort.direction == '') { return data; }

    return data.sort((a, b) => {
      let propertyA: string = '';
      let propertyB: string = '';

      switch (this._sort.active) {
        case 'title': [propertyA, propertyB] = [a.header.title, b.header.title]; break;
        case 'date': [propertyA, propertyB] = [a.header.date, b.header.date]; break;
      }

      let valueA = isNaN(+propertyA) ? propertyA : +propertyA;
      let valueB = isNaN(+propertyB) ? propertyB : +propertyB;

      return (valueA < valueB ? -1 : 1) * (this._sort.direction == 'asc' ? 1 : -1);
    });
  }

  filterData(query: string, data: Transaction[]): Transaction[] {
    if(query != undefined && query != "" ){
      return data.filter( tr => {
        let words = query.split(" ").filter(s => s != "").map( s => s.toLowerCase())

        return words.some( word => {
          let titleMatches, amountOrAccountMatches : boolean = false
          titleMatches = tr.header.title && tr.header.title.toLowerCase().indexOf(word) >= 0
          amountOrAccountMatches = tr.postings.some( p => {
              return p.account.toLowerCase().indexOf(word) >= 0 || (p.amount && p.amount.toString().indexOf(word) >= 0)
          })

          return titleMatches || amountOrAccountMatches
        })
      })
    }
    else {
      return data
    }
  }
}
