import { Observable } from 'rxjs/Observable';
import { selectedAccountsSelector, AppStateActions, allAccountsSelector } from './../../shared/reducers/app-state-reducer';
import { NgRedux } from '@angular-redux/store';
import { AppState } from './../../shared/models/app-state';
import { Component, Input, OnInit } from '@angular/core';
import { Account, ReduxAccount } from '../../shared/models/account';

@Component({
  selector: 'app-account-tree',
  styleUrls: ['./account-tree.component.css'],
  templateUrl: './account-tree.component.html',
})
export class AccountTreeComponent implements OnInit {

  @Input()
  accountName: string;

  @Input()
  treeLevel: number;

  isCollapsed = false;
  isChecked: boolean;
  account: ReduxAccount;

  constructor(private ngRedux: NgRedux<AppState>) {
  }

  ngOnInit() {
    this.ngRedux.select(selectedAccountsSelector)
    .map(accounts => accounts.includes(this.accountName))
    .do(c => { this.isChecked = c; }).subscribe();
    this.ngRedux.select(allAccountsSelector)
    .map(accounts => accounts[this.accountName])
    .do(a => this.account = a)
    .subscribe();
  }

  checkAccount(chk: boolean) {
    this.ngRedux.dispatch(AppStateActions.selectAccount(this.accountName, chk));
  }

  toggle() {
    this.isCollapsed = !this.isCollapsed;
  }

}

