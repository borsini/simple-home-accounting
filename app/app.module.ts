import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent, TransactionComponent, PostingComponent, AccountTreeComponent, NumberToArray, KeysPipe }   from './app.component';
import { LedgerService }        from './ledgerservice';

@NgModule({
  imports:      [ BrowserModule ],
  declarations: [ AppComponent, TransactionComponent, PostingComponent, AccountTreeComponent, NumberToArray, KeysPipe ],
  bootstrap:    [ AppComponent ],
  providers:    [ LedgerService ]
})
export class AppModule { }