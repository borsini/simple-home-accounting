import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { presentSelector, UndoRedoState } from '../../shared/reducers/undo-redo-reducer';
import { NgRedux } from '@angular-redux/store';
import { AppState } from '../../shared/models/app-state';
import {
  canAutosearchSelector,
  AppStateActions,
  filtersSelector,
  selectedTransactionsSelector,
  invalidSelectedTransactionsSelector,
  minAndMaxAllowedDateSelector } from '../../shared/reducers/app-state-reducer';
import { filter } from 'rxjs/operators';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { Observable } from 'rxjs/Observable';
import * as moment from 'moment';

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.css'],
})
export class FiltersComponent implements OnInit {

  @ViewChild('filter') filter: ElementRef;

  showOnlyInvalid: Observable<boolean>;
  invalidCount: Observable<number>;
  shouldHideFilters: Observable<boolean>;
  minDate: Observable<moment.Moment | undefined>;
  maxDate: Observable<moment.Moment | undefined>;

  constructor(private ngRedux: NgRedux<UndoRedoState<AppState>>) { }

  ngOnInit() {
    fromEvent(this.filter.nativeElement, 'keyup')
    .debounceTime(200)
    .do(_ => this.ngRedux.dispatch(AppStateActions.setInputFilter(this.filter.nativeElement.value)))
    .subscribe();

    this.showOnlyInvalid = this.ngRedux.select(presentSelector(filtersSelector)).map(f => f.showOnlyInvalid);
    this.invalidCount = this.ngRedux.select(presentSelector(invalidSelectedTransactionsSelector)).map(i => i.length);
    this.shouldHideFilters = this.ngRedux.select(presentSelector(selectedTransactionsSelector))
    .map(t => t.length === 0);

    const minAndMax = this.ngRedux.select(presentSelector(minAndMaxAllowedDateSelector));

    this.minDate = minAndMax.map(result => result.min ? moment.unix(result.min) : undefined);
    this.maxDate = minAndMax.map(result => result.max ? moment.unix(result.max) : undefined);
  }

  checkOnlyInvalid(check: boolean) {
    this.ngRedux.dispatch(AppStateActions.showOnlyInvalid(check));
  }

  startDateChanged(date: moment.Moment) {
    this.ngRedux.dispatch(AppStateActions.setMinDate(date && date.isValid() ? date.unix() : undefined));
  }

  endDateChanged(date: moment.Moment) {
    this.ngRedux.dispatch(AppStateActions.setMaxDate(date && date.isValid() ? date.unix() : undefined));
  }
}
