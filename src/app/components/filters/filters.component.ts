import { Component, OnInit, ViewChild, ElementRef, HostListener, Input } from '@angular/core';
import { Subject } from 'rxjs/Subject';
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
    .debounceTime(200)
    .do(_ => this.ngRedux.dispatch(AppStateActions.setInputFilter(this.filter.nativeElement.value, this.tabId)))
    .subscribe();

    this.showOnlyInvalid = this.ngRedux.select(presentSelector(filtersSelector(this.tabId))).map(f => f.showOnlyInvalid);
    this.invalidCount = this.ngRedux.select(presentSelector(invalidTransactionsSelector)).map(i => i.length);
    this.shouldHideFilters = this.ngRedux.select(presentSelector(allTransactionsSelector))
    .map(t => Object.keys(t).length === 0);

    const minAndMax = this.ngRedux.select(presentSelector(minAndMaxAllowedDateSelector));

    this.minDate = minAndMax.map(result => result.min ? moment.unix(result.min) : undefined);
    this.maxDate = minAndMax.map(result => result.max ? moment.unix(result.max) : undefined);
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
