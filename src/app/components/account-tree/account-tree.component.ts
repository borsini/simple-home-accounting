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
  private _isChecked = false;

  constructor(private stateService: AppStateService) {
  }

  ngOnInit() {
    this.stateService.selectedAccountsHotObservable().subscribe(accounts => {
      const shouldBeChecked = accounts.has(this.account);
      if (shouldBeChecked !== this.isChecked) {
        this._isChecked = shouldBeChecked;
        this.stateService.selectAccountsColdObservable(shouldBeChecked, Array.from(this.account.children)).subscribe();
      }
    });
  }

  @Input()
  set isChecked(isChecked: boolean) {
    this.stateService.selectAccountsColdObservable(isChecked, [this.account]).subscribe();
  }

  get isChecked(): boolean { return this._isChecked; }

  onAccountSelected() {
   // this.stateService.selectAccount(this.account, true).subscribe()
  }

  onAccountChecked(chk: boolean) {
//    this.isChecked = chk
  }

  onChildSelected(account: Account) {
   // this.stateService.selectAccount(account, true).subscribe()
  }

  toggle() {
    this.isCollapsed = !this.isCollapsed;
  }

}

