import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CdkTableModule } from '@angular/cdk/table';
import {MdButtonModule, MdCheckboxModule, MdToolbarModule, MdSidenavModule, MdTableModule, MdPaginatorModule, MdSortModule, MdInputModule, MdProgressSpinnerModule, MdDialogModule, MdDatepickerModule, MdNativeDateModule, MdAutocompleteModule, MdCardModule, DateAdapter, MD_DATE_FORMATS} from '@angular/material';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';

import { AppComponent, DialogResultExampleDialog, DialogTwoOptionsDialog } from './app.component';
import { AccountTreeComponent } from './account-tree/account-tree.component';

import { AppStateService } from './app-state.service';
import { MenuDrawerComponent } from './menu-drawer/menu-drawer.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { EditTransactionComponent } from './edit-transaction/edit-transaction.component';
import { MomentDateAdapter, MOMENT_DATE_FORMATS } from './moment-date-adapter'
@NgModule({
  declarations: [
    AppComponent,
    AccountTreeComponent,
    MenuDrawerComponent,
    TransactionsComponent,
    DialogResultExampleDialog,
    DialogTwoOptionsDialog,
    EditTransactionComponent,
  ],
  entryComponents: [
    DialogResultExampleDialog,
    DialogTwoOptionsDialog
  ],
  imports: [
    BrowserModule, MdButtonModule, MdCheckboxModule, MdToolbarModule, MdSidenavModule, CdkTableModule, MdTableModule, MdPaginatorModule,BrowserAnimationsModule, MdSortModule, MdInputModule, MdProgressSpinnerModule, MdDialogModule, MdDatepickerModule, MdNativeDateModule, ReactiveFormsModule, MdAutocompleteModule, MdNativeDateModule, MdCardModule
  ],
  providers : [
    AppStateService, 
    {provide: DateAdapter, useClass: MomentDateAdapter},
    {provide: MD_DATE_FORMATS, useValue: MOMENT_DATE_FORMATS},
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
