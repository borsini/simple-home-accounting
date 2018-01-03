import { CdkTableModule } from '@angular/cdk/table';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  DateAdapter,
  MD_DATE_FORMATS,
  MdAutocompleteModule,
  MdButtonModule,
  MdCardModule,
  MdCheckboxModule,
  MdDatepickerModule,
  MdDialogModule,
  MdInputModule,
  MdNativeDateModule,
  MdPaginatorModule,
  MdProgressSpinnerModule,
  MdSidenavModule,
  MdSortModule,
  MdTableModule,
  MdToolbarModule } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AccountTreeComponent } from './account-tree/account-tree.component';
import { AppComponent, DialogResultExampleDialogComponent, DialogTwoOptionsDialogComponent } from './app.component';

import { AppStateService } from './app-state.service';
import { EditTransactionComponent } from './edit-transaction/edit-transaction.component';
import { MenuDrawerComponent } from './menu-drawer/menu-drawer.component';
import { MOMENT_DATE_FORMATS, MomentDateAdapter } from './moment-date-adapter';
import { TransactionsComponent } from './transactions/transactions.component';
@NgModule({
  bootstrap: [AppComponent],
  declarations: [
    AppComponent,
    AccountTreeComponent,
    MenuDrawerComponent,
    TransactionsComponent,
    DialogResultExampleDialogComponent,
    DialogTwoOptionsDialogComponent,
    EditTransactionComponent,
  ],
  entryComponents: [
    DialogResultExampleDialogComponent,
    DialogTwoOptionsDialogComponent,
  ],
  imports: [
    BrowserModule,
    MdButtonModule,
    MdCheckboxModule,
    MdToolbarModule,
    MdSidenavModule,
    CdkTableModule,
    MdTableModule,
    MdPaginatorModule,
    BrowserAnimationsModule,
    MdSortModule,
    MdInputModule,
    MdProgressSpinnerModule,
    MdDialogModule,
    MdDatepickerModule,
    MdNativeDateModule,
    ReactiveFormsModule,
    MdAutocompleteModule,
    MdNativeDateModule,
    MdCardModule,
  ],
  providers : [
    AppStateService,
    {provide: DateAdapter, useClass: MomentDateAdapter},
    {provide: MD_DATE_FORMATS, useValue: MOMENT_DATE_FORMATS},
  ],
})
export class AppModule { }
