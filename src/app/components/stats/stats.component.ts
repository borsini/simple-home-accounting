import { Component, OnInit, ViewChild } from '@angular/core';
import { NgRedux } from '@angular-redux/store';
import { UndoRedoState, presentSelector } from '../../shared/reducers/undo-redo-reducer';
import { AppState, DebitCreditRepartition, DebitCreditLine } from '../../shared/models/app-state';
import { filtersSelector, statsRepartitionSelector, AppStateActions, maxLevelSelector } from '../../shared/reducers/app-state-reducer';
import { Observable } from 'rxjs/Observable';
import { DataSource } from '@angular/cdk/table';
import { MatSort, Sort } from '@angular/material';
import { from } from 'rxjs/observable/from';
import { concat } from 'rxjs/observable/concat';
import { of } from 'rxjs/observable/of';
import { combineLatest } from 'rxjs/observable/combineLatest';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css'],
})
export class StatsComponent implements OnInit {

  @ViewChild(MatSort) sort: MatSort;
  maxLevel: Observable<number>;
  dataSource: RepartitionDataSource;
  displayedColumns = ['account', 'debits', 'credits'];

  constructor(private ngRedux: NgRedux<UndoRedoState<AppState>>) { }

  ngOnInit() {
    this.maxLevel = this.ngRedux.select(presentSelector(maxLevelSelector));
    this.dataSource = new RepartitionDataSource(this.ngRedux, this.sort);
  }

  onStatsChecked(checked: boolean) {
    this.ngRedux.dispatch(AppStateActions.activateStats(checked));
  }

  sliderChanged(value) {
    this.ngRedux.dispatch(AppStateActions.setStatsLevel(value));
  }

}


export class RepartitionDataSource extends DataSource<DebitCreditLine> {

  constructor(
    private ngRedux: NgRedux<UndoRedoState<AppState>>,
    private _sort: MatSort) {
    super();

    this._sort.active = 'account';
    this._sort.start = 'asc';
    this._sort.direction = 'asc';
  }

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<DebitCreditLine[]> {

    const sorts = concat(
      of<Sort>({active: this._sort.active, direction: this._sort.direction}),
      from<Sort>(this._sort.sortChange),
    );

    const repartition = this.ngRedux.select(presentSelector(statsRepartitionSelector))
    .map(r => Object.values(r));

    return combineLatest(sorts, repartition).map( ([s, r]) => {
      return r.sort( (a, b) => {
        let propertyA: string | number | number = '';
        let propertyB: string | number | number = '';

        switch (this._sort.active) {
          case 'account': [propertyA, propertyB] = [a.account, b.account]; break;
          case 'debits': [propertyA, propertyB  ] = [Number.parseFloat(a.debits), Number.parseFloat(b.debits)]; break;
          case 'credits': [propertyA, propertyB  ] = [Number.parseFloat(a.credits), Number.parseFloat(b.credits)]; break;
        }

        const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
        const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

        return (valueA < valueB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1);
      });
    });
  }

  disconnect() {}

}

