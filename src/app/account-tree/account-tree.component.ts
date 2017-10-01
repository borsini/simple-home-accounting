import { Component, Input, Output, EventEmitter } from '@angular/core';
import {Account} from '../models/models'
import { AppStateService } from '../app-state.service';

@Component({
  selector: 'account-tree',
  templateUrl: './account-tree.component.html',
  styleUrls: ['./account-tree.component.css']
})
export class AccountTreeComponent {

  @Input()
  account: Account;

  isCollapsed: boolean = false;
  private _isChecked: boolean = false;

  constructor(private stateService: AppStateService) {
  }

  ngOnInit() {
    this.stateService.selectedAccountsHotObservable().subscribe(accounts => {
      let shouldBeChecked = accounts.has(this.account)
      if(shouldBeChecked != this.isChecked){
        this._isChecked = shouldBeChecked
        this.stateService.selectAccountsColdObservable(shouldBeChecked, Array.from(this.account.children)).subscribe()
      }
    })
  }

  @Input()
  set isChecked(isChecked: boolean) {
    this.stateService.selectAccountsColdObservable(isChecked, [this.account]).subscribe()
  }
 
  get isChecked(): boolean { return this._isChecked; }

  onAccountSelected(){
   // this.stateService.selectAccount(this.account, true).subscribe()
  }

  onAccountChecked(chk : boolean){
   // console.log(this.isChecked)
//    this.isChecked = chk
  }

  onChildSelected(account: Account){
   // this.stateService.selectAccount(account, true).subscribe()
  }

  toggle(){
    this.isCollapsed = !this.isCollapsed;
  }
  
}

