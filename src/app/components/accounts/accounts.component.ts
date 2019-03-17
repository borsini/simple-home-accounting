import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { TreeDatasource, TreeDelegate, TreeItem } from '../tree/models';
import { Observable ,  fromEvent, BehaviorSubject } from 'rxjs';
import { NgRedux } from '@angular-redux/store';
import { debounceTime, tap, flatMap } from 'rxjs/operators';
import { UndoRedoState, presentSelector } from '../../shared/reducers/undo-redo-reducer';
import { AppState, AccountMap } from '../../shared/models/app-state';
import { allAccountsSelector, accountsFiltered } from '../../shared/selectors/selectors';
import { AppStateActions } from '../../shared/reducers/app-state-reducer';
import { startWith, filter, map } from 'rxjs/operators';
import { intersectionReducer } from '../../shared/utils/utils';

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.css']
})
export class AccountsComponent implements OnInit {

  @ViewChild('filter') filter: ElementRef;
  
  treeDatasource: TreeDatasource;
  treeDelegate: TreeDelegate;
  isInputDisabled = false;
  
  constructor(private ngRedux: NgRedux<UndoRedoState<AppState>>) {
    this.treeDelegate = {
      onItemClicked: (item: TreeItem) => {
        this.ngRedux.dispatch(AppStateActions.openTab([item.id]));
      },
      onItemChecked: (item: TreeItem, isChecked: boolean) => {
        console.log("onItemChecked", item, isChecked);
      },
    };
  }

  ngOnInit() {
    const filteredAccountsSubject = new BehaviorSubject({} as AccountMap);

    fromEvent(this.filter.nativeElement, 'keyup')
    .pipe(
      debounceTime(150),
      map(_ => this.filter.nativeElement.value as string),
      tap(_ => this.isInputDisabled = true),
      startWith(""),
      flatMap(f => this.ngRedux.select(presentSelector(accountsFiltered(f)))),
      tap(_ => this.isInputDisabled = false)
    ).subscribe(filteredAccountsSubject)

    this.treeDatasource = {
      getItemForId: (id: string): Observable<TreeItem | undefined> =>
      filteredAccountsSubject.pipe(map(filteredAccounts => {
        const a = filteredAccounts[id];
        return a ? {
          id,
          title: a.name.split(':').slice(-1)[0],
          subtitle: a.balance.toString(),
          isChecked: false,
          childrenIds: [a.children, Object.keys(filteredAccounts)].reduce(intersectionReducer).sort()
        } : undefined;
      }))
    };
  }

}
