import { Observable } from 'rxjs/Observable';
import { AppStateActions } from './../../shared/reducers/app-state-reducer';
import {
  allAccountsSelector,
  selectedAccountsSelector,
} from './../../shared/selectors/selectors';
import { NgRedux } from '@angular-redux/store';
import { AppState } from './../../shared/models/app-state';
import { Component, Input, OnInit } from '@angular/core';
import { Account } from '../../shared/models/account';
import { UndoRedoState, presentSelector } from '../../shared/reducers/undo-redo-reducer';

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
  account: Account;

  constructor(private ngRedux: NgRedux<UndoRedoState<AppState>>) {
  }

  ngOnInit() {
    this.ngRedux.select(presentSelector(selectedAccountsSelector('ROOT')))
    .map(accounts => accounts.includes(this.accountName))
    .do(c => { this.isChecked = c; }).subscribe();
    this.ngRedux.select(presentSelector(allAccountsSelector))
    .map(accounts => accounts[this.accountName])
    .do(a => this.account = a)
    .subscribe();
  }

  checkAccount(chk: boolean) { }

  toggle() {
    this.isCollapsed = !this.isCollapsed;
  }

}

