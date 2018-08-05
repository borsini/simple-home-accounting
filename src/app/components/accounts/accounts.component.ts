import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { TreeDatasource, TreeDelegate, TreeItem } from '../tree/models';
import { Observable } from 'rxjs/Observable';
import { NgRedux } from '@angular-redux/store';
import { UndoRedoState, presentSelector } from '../../shared/reducers/undo-redo-reducer';
import { AppState } from '../../shared/models/app-state';
import { allAccountsSelector, accountsFiltered } from '../../shared/selectors/selectors';
import { AppStateActions } from '../../shared/reducers/app-state-reducer';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { startWith, filter } from 'rxjs/operators';
import { combineLatest } from 'rxjs/observable/combineLatest';
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
    const filterValue = fromEvent(this.filter.nativeElement, 'keyup')
    .debounceTime(700)
    .do(console.log)
    .pipe(startWith('fake'))
    .map(_ => this.filter.nativeElement.value as string);

    const accounts = filterValue
    .do(_ => this.isInputDisabled = true)
    .flatMap(f => this.ngRedux.select(presentSelector(accountsFiltered(f))))
    .do(_ => this.isInputDisabled = false)

    this.treeDatasource = {
      getItemForId: (id: string): Observable<TreeItem | undefined> =>
      accounts.map(filteredAccounts => {
        const a = filteredAccounts[id];
        return a ? {
          id,
          title: a.name.split(':').slice(-1)[0],
          subtitle: a.balance.toString(),
          isChecked: false,
          childrenIds: [a.children, Object.keys(filteredAccounts)].reduce(intersectionReducer)
        } : undefined;
      })
    };
  }

}
