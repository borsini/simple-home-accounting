import { Component, Input, OnInit } from '@angular/core';
import { AppStateService } from '../../shared/services/app-state/app-state.service';
import { Account } from '../../shared/models/account';

@Component({
  selector: 'app-account-tree',
  styleUrls: ['./account-tree.component.css'],
  templateUrl: './account-tree.component.html',
})
export class AccountTreeComponent implements OnInit {

  @Input()
  account: Account;

  isCollapsed = false;
  isChecked = false;

  constructor(private stateService: AppStateService) {
  }

  ngOnInit() {
    this.stateService.selectedAccountsHotObservable().subscribe(accounts => {
      this.isChecked = accounts.has(this.account);
    });
  }

  checkAccount(chk: boolean) {
    this.stateService.selectAccountColdObservable(chk, this.account).subscribe();
  }

  toggle() {
    this.isCollapsed = !this.isCollapsed;
  }

}

