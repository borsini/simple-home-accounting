import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { AppStateService } from '../../shared/services/app-state/app-state.service';

@Component({
  selector: 'app-menu-drawer',
  templateUrl: './menu-drawer.component.html',
  styleUrls: ['./menu-drawer.component.css'],
})
export class MenuDrawerComponent implements OnInit {

  nbAccountsSelected: Observable<Number>;
  rootAccount: Observable<Account | undefined>;

  constructor(state: AppStateService) {
    this.nbAccountsSelected = state.selectedAccountsHotObservable().map( a => a.size);
    this.rootAccount = state.rootAccountHotObservable();
  }

  ngOnInit() {
  }

}
