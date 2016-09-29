import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent }   from './app.component';
import { HeaderComponent }   from './app.component';
import { MenuComponent }   from './app.component';
import { ContentComponent }   from './app.component';
import { LedgerService }        from './ledgerservice';

@NgModule({
  imports:      [ BrowserModule ],
  declarations: [ AppComponent, MenuComponent, ContentComponent, HeaderComponent ],
  bootstrap:    [ AppComponent, MenuComponent, ContentComponent, HeaderComponent ],
  providers:    [ LedgerService ]
})
export class AppModule { }