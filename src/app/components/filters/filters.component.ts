import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { presentSelector, UndoRedoState } from '../../shared/reducers/undo-redo-reducer';
import { NgRedux } from '@angular-redux/store';
import { AppState } from '../../shared/models/app-state';
import { canAutosearchSelector, AppStateActions } from '../../shared/reducers/app-state-reducer';
import { filter } from 'rxjs/operators';
import { fromEvent } from 'rxjs/observable/fromEvent';

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.css'],
})
export class FiltersComponent implements OnInit {

  @ViewChild('filter') filter: ElementRef;

  private onKeyDownSubject = new Subject();

  constructor(private ngRedux: NgRedux<UndoRedoState<AppState>>) { }

  ngOnInit() {
    this.onKeyDownSubject.asObservable().flatMap(_ => this.ngRedux.select(presentSelector(canAutosearchSelector)).take(1))
    .pipe(filter(a => a))
    .do(_ => this.filter.nativeElement.focus())
    .subscribe();

    fromEvent(this.filter.nativeElement, 'keyup')
    .debounceTime(200)
    .do(_ => this.ngRedux.dispatch(AppStateActions.setInputFilter(this.filter.nativeElement.value)))
    .subscribe();
  }

  @HostListener('document:keydown', ['$event']) onKeydownHandler(event: KeyboardEvent) {
    this.onKeyDownSubject.next();
  }
}
