import { Component, Inject } from '@angular/core'
import { AsyncPipe } from '@angular/common'
import {MdDialog, MdDialogRef, MD_DIALOG_DATA} from '@angular/material'
import { AppStateService } from './app-state.service'
import { LedgerService } from './ledger.service'
import { OfxService } from './ofx.service'
import { Account, Transaction } from './models/models'

import * as fileSaver from 'file-saver'

import {Observable} from 'rxjs'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [ LedgerService, OfxService]
})
export class AppComponent {
  private _flatAccounts: Map<String, Account>

  isLoading: boolean
  rootAccount : Observable<Account>
  title = 'app';

  constructor(private _state: AppStateService, private _ledger: LedgerService, private _ofx: OfxService, public dialog: MdDialog){
    
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
      e => {
        this.openErrorDialog(e)
        this.isLoading = false
      },
      () => this.isLoading = false
    )
  }

  uploadOfxOnChange(files: FileList) {
    this.isLoading = true
    this.readFileObservable(files.item(0))
    .flatMap( res => this._ofx.parseOfxString(res))
    .flatMap(tr => this._state.setTransactions(tr) )
    .subscribe(
      transactions => console.log(transactions),
      e => {
        this.openErrorDialog(e)
        this.isLoading = false
      },
      () => this.isLoading = false
    )
  }

  saveLedgerClicked() {
    this._state.allTransactions()
    .flatMap(tr => this._ledger.generateLedgerString(tr))
    .do(ledger => {
      var blob = new Blob([ledger], {type: "text/plain;charset=utf-8"});
      fileSaver.saveAs(blob, "accounts.ledger");
    })
    .subscribe()    
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

  private openErrorDialog(e: any) {
    let dialogRef = this.dialog.open(DialogResultExampleDialog, {
      data: e,
    });
    dialogRef.afterClosed().subscribe(result => {
      //this.selectedOption = result;
    });
  }
}

@Component({
  selector: 'dialog-result-example-dialog',
  template: '<h2>Erreur</h2>{{ data }}',
})
export class DialogResultExampleDialog {
  constructor(public dialogRef: MdDialogRef<DialogResultExampleDialog>, @Inject(MD_DIALOG_DATA) public data: any) {}
}
