import { Component } from '@angular/core'
import { AsyncPipe } from '@angular/common'
import { AppStateService } from './app-state.service'
import { LedgerService } from './ledger.service'
import { Account, Transaction } from './models/models'

import {Observable} from 'rxjs'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [ LedgerService]
})
export class AppComponent {
  private _flatAccounts: Map<String, Account>

  isLoading: boolean
  rootAccount : Observable<Account>
  title = 'app';

  constructor(private _state: AppStateService, private _ledger: LedgerService){
    
    this.isLoading = false
    this._flatAccounts = new Map()
    this.rootAccount = _state.rootAccount().map( a => {
      console.log(a)
      return a
    })
  }

  uploadLedgerOnChange(files: FileList) {

    this.isLoading = true

    this.readFileObservable(files.item(0))
    .flatMap( res => this._ledger.parseLedgerString(res))
    .flatMap(tr => this._state.setTransactions(tr) )
    .subscribe(
      transactions => console.log(transactions),
      e => console.log(e),
      () => this.isLoading = false
    )
  }

  private readFileObservable(file: Blob): Observable<string> {
    return new Observable( obs => {
      var reader = new FileReader();
      reader.addEventListener('load', function () {
        obs.next(reader.result as string)
        obs.complete()
      })

      reader.readAsText(file)
    })
  }

  
}
