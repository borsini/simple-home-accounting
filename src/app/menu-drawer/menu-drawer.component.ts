import { Component, OnInit } from '@angular/core';
import {Observable} from 'rxjs'
import { AppStateService } from '../app-state.service';

@Component({
  selector: 'menu-drawer',
  templateUrl: './menu-drawer.component.html',
  styleUrls: ['./menu-drawer.component.css']
})
export class MenuDrawerComponent implements OnInit {

  nbAccountsSelected: Observable<Number>
  rootAccount : Observable<Account | undefined>

  constructor(state: AppStateService) { 
    this.nbAccountsSelected = state.selectedAccounts().map( a => a.size)
    this.rootAccount = state.rootAccount()
  }

  ngOnInit() {
  }

}
