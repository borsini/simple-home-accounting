
import {map,  debounceTime, tap } from 'rxjs/operators';
import { Component, OnInit, ViewChild, ElementRef, HostListener, Input } from '@angular/core';
import { Subject ,  fromEvent ,  Observable } from 'rxjs';
import { presentSelector, UndoRedoState } from '../../shared/reducers/undo-redo-reducer';
import { NgRedux } from '@angular-redux/store';
import { AppState } from '../../shared/models/app-state';
import { AppStateActions } from '../../shared/reducers/app-state-reducer';

import {
  allTransactionsSelector,
  filtersSelector,
  selectedTransactionsSelector,
  invalidTransactionsSelector,
  minAndMaxAllowedDateSelector,
  allTagsSelector,
} from '../../shared/selectors/selectors';
import * as moment from 'moment';

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.css'],
})
export class FiltersComponent implements OnInit {

  @Input() tabId;
  @ViewChild('filter') filter: ElementRef;

  showOnlyInvalid: Observable<boolean>;
  invalidCount: Observable<number>;
  shouldHideFilters: Observable<boolean>;
  minDate: Observable<moment.Moment | undefined>;
  maxDate: Observable<moment.Moment | undefined>;
  tags: Observable<string[]>;

  constructor(private ngRedux: NgRedux<UndoRedoState<AppState>>) { }

  ngOnInit() {
    fromEvent(this.filter.nativeElement, 'keyup')
    .pipe(debounceTime(200))
    .pipe(tap(_ => this.ngRedux.dispatch(AppStateActions.setInputFilter(this.filter.nativeElement.value, this.tabId))))
    .subscribe();

    this.showOnlyInvalid = this.ngRedux.select(presentSelector(filtersSelector(this.tabId))).pipe(map(f => f.showOnlyInvalid));
    this.invalidCount = this.ngRedux.select(presentSelector(invalidTransactionsSelector)).pipe(map(i => i.length));
    this.shouldHideFilters = this.ngRedux.select(presentSelector(allTransactionsSelector)).pipe(
    map(t => Object.keys(t).length === 0));

    const minAndMax = this.ngRedux.select(presentSelector(minAndMaxAllowedDateSelector));

    this.minDate = minAndMax.pipe(map(result => result.min ? moment.unix(result.min) : undefined));
    this.maxDate = minAndMax.pipe(map(result => result.max ? moment.unix(result.max) : undefined));
    this.tags = this.ngRedux.select(presentSelector(allTagsSelector(this.tabId)))
  }

  checkOnlyInvalid(check: boolean) {
    this.ngRedux.dispatch(AppStateActions.showOnlyInvalid(check, this.tabId));
  }

  startDateChanged(date: moment.Moment) {
    this.ngRedux.dispatch(AppStateActions.setMinDate(date && date.isValid() ? date.unix() : undefined, this.tabId));
  }

  endDateChanged(date: moment.Moment) {
    this.ngRedux.dispatch(AppStateActions.setMaxDate(date && date.isValid() ? date.unix() : undefined, this.tabId));
  }

  tagsChanged(selectedTags: string[]) {
    this.ngRedux.dispatch(AppStateActions.setTags(selectedTags, this.tabId));
  }
}
