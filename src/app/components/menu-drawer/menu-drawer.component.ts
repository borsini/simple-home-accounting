
import {map} from 'rxjs/operators';
import { Account } from './../../shared/models/account';
import { selectedAccountsSelector, selectedTransactionsSelector, rootAccountSelector } from './../../shared/selectors/selectors';
import { AppState } from './../../shared/models/app-state';
import { NgRedux } from '@angular-redux/store';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { UndoRedoState, presentSelector } from '../../shared/reducers/undo-redo-reducer';

@Component({
  selector: 'app-menu-drawer',
  templateUrl: './menu-drawer.component.html',
  styleUrls: ['./menu-drawer.component.css'],
})
export class MenuDrawerComponent implements OnInit {

  nbAccountsSelected: Observable<Number>;
  nbTransactionsSelected: Observable<Number>;
  rootAccount: Observable<string | undefined>;

  constructor(private ngRedux: NgRedux<UndoRedoState<AppState>>) {
    this.nbAccountsSelected = ngRedux.select(presentSelector(selectedAccountsSelector)).pipe(map( a => a.length));
    this.nbTransactionsSelected = ngRedux.select(presentSelector(selectedTransactionsSelector)).pipe(map( t => t.length));
    this.rootAccount = ngRedux.select(presentSelector(rootAccountSelector));
  }

  ngOnInit() {
  }

}
