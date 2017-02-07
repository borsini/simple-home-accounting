import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { 
  AppComponent, 
  TransactionHeaderComponent,
  TransactionBodyComponent,
  AccountTreeComponent, 
  NumberToArray, 
  KeysPipe }   from './app.component';
import { LedgerService }        from './ledgerservice';

@NgModule({
  imports:      [ BrowserModule ],
  declarations: [ AppComponent, TransactionHeaderComponent, TransactionBodyComponent, AccountTreeComponent, NumberToArray, KeysPipe ],
  bootstrap:    [ AppComponent ],
  providers:    [ LedgerService ]
})
export class AppModule { }