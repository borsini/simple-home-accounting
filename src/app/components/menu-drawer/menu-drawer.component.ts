import { ReduxAccount } from './../../shared/models/account';
import { selectedAccountsSelector, selectedTransactionsSelector, rootAccountSelector } from './../../shared/reducers/app-state-reducer';
import { AppState } from './../../shared/models/app-state';
import { NgRedux } from '@angular-redux/store';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-menu-drawer',
  templateUrl: './menu-drawer.component.html',
  styleUrls: ['./menu-drawer.component.css'],
})
export class MenuDrawerComponent implements OnInit {

  nbAccountsSelected: Observable<Number>;
  nbTransactionsSelected: Observable<Number>;
  rootAccount: Observable<string | undefined>;

  constructor(private ngRedux: NgRedux<AppState>) {
    this.nbAccountsSelected = ngRedux.select(selectedAccountsSelector).map( a => a.length);
    this.nbTransactionsSelected = ngRedux.select(selectedTransactionsSelector).map( t => t.length);
    this.rootAccount = ngRedux.select(rootAccountSelector);
  }

  ngOnInit() {
  }

}
