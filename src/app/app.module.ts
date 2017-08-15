import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CdkTableModule } from '@angular/cdk';
import {MdButtonModule, MdCheckboxModule, MdToolbarModule, MdSidenavModule, MdTableModule, MdPaginatorModule, MdSortModule, MdInputModule, MdProgressSpinnerModule, MdDialogModule} from '@angular/material';

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';


import { AppComponent, DialogResultExampleDialog } from './app.component';
import { AccountTreeComponent } from './account-tree/account-tree.component';

import { AppStateService } from './app-state.service';
import { MenuDrawerComponent } from './menu-drawer/menu-drawer.component';
import { TransactionsComponent } from './transactions/transactions.component';

@NgModule({
  declarations: [
    AppComponent,
    AccountTreeComponent,
    MenuDrawerComponent,
    TransactionsComponent,
    DialogResultExampleDialog,
  ],
  entryComponents: [
    DialogResultExampleDialog
  ],
  imports: [
    BrowserModule, MdButtonModule, MdCheckboxModule, MdToolbarModule, MdSidenavModule, CdkTableModule, MdTableModule, MdPaginatorModule,BrowserAnimationsModule, MdSortModule, MdInputModule, MdProgressSpinnerModule, MdDialogModule
  ],
  providers : [AppStateService, ],
  bootstrap: [AppComponent]
})
export class AppModule { }
