import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CdkTableModule } from '@angular/cdk';
import {MdButtonModule, MdCheckboxModule, MdToolbarModule, MdSidenavModule, MdTableModule, MdPaginatorModule, MdSortModule, MdInputModule, MdProgressSpinnerModule} from '@angular/material';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';


import { AppComponent } from './app.component';
import { AccountTreeComponent } from './account-tree/account-tree.component';

import { AppStateService } from './app-state.service';
import { MenuDrawerComponent } from './menu-drawer/menu-drawer.component';
import { TransactionsComponent } from './transactions/transactions.component';

@NgModule({
  declarations: [
    AppComponent,
    AccountTreeComponent,
    MenuDrawerComponent,
    TransactionsComponent
  ],
  imports: [
    BrowserModule, MdButtonModule, MdCheckboxModule, MdToolbarModule, MdSidenavModule, CdkTableModule, MdTableModule, MdPaginatorModule,BrowserAnimationsModule, MdSortModule, MdInputModule, MdProgressSpinnerModule
  ],
  providers : [AppStateService],
  bootstrap: [AppComponent]
})
export class AppModule { }
