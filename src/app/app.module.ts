import { CdkTableModule } from '@angular/cdk/table';
import { NgModule, isDevMode } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  DateAdapter, MAT_DATE_FORMATS, MatAutocompleteModule, MatButtonModule, MatCardModule, MatCheckboxModule, MatDatepickerModule,
  MatIconModule,
  MatDialogModule, MatFormFieldModule, MatInputModule, MatNativeDateModule, MatPaginatorModule, MatProgressSpinnerModule, MatSidenavModule, MatSortModule,
  MatTableModule, MatToolbarModule,
} from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AccountTreeComponent } from './components/account-tree/account-tree.component';
import { AppComponent, DialogResultExampleDialogComponent, DialogTwoOptionsDialogComponent } from './app.component';

import { EditTransactionComponent } from './components/edit-transaction/edit-transaction.component';
import { MenuDrawerComponent } from './components/menu-drawer/menu-drawer.component';
import { TransactionsComponent } from './components/transactions/transactions.component';
import { MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { NgReduxModule, NgRedux, DevToolsExtension } from '@angular-redux/store';
import { AppState, ReduxAppState } from './shared/models/app-state';
import { rootReducer, INITIAL_STATE } from './shared/reducers/app-state-reducer';

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
    MatButtonModule,
    MatCheckboxModule,
    MatToolbarModule,
    MatSidenavModule,
    CdkTableModule,
    MatTableModule,
    MatPaginatorModule,
    BrowserAnimationsModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatNativeDateModule,
    MatCardModule,
    NgReduxModule,
  ],
  providers : [
    {provide: DateAdapter, useClass: MomentDateAdapter},
    {provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS},
  ],
})
export class AppModule {
  constructor(
    private ngRedux: NgRedux<ReduxAppState>,
    private devTools: DevToolsExtension,
  ) {
    this.ngRedux.configureStore(
      rootReducer,
      INITIAL_STATE,
      [],
      isDevMode() && devTools.isEnabled() ? [devTools.enhancer()] : []);
  }
}
