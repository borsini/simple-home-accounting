import { Component, Inject } from '@angular/core'
import { AsyncPipe } from '@angular/common'
import {MdDialog, MdDialogRef, MD_DIALOG_DATA} from '@angular/material'
import { AppStateService } from './app-state.service'
import { LedgerService } from './ledger.service'
import { OfxService } from './ofx.service'
import { Account, Transaction } from './models/models'
import { v4 as uuid } from 'uuid'
import * as fileSaver from 'file-saver'

import {Observable, Subject, BehaviorSubject} from 'rxjs'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [ LedgerService, OfxService]
})
export class AppComponent {
  private _flatAccounts: Map<String, Account>

  isLoading: boolean
  openDrawer : Subject<boolean> = new BehaviorSubject(false)
  title = 'app';

  constructor(private _state: AppStateService, private _ledger: LedgerService, private _ofx: OfxService, public dialog: MdDialog){
    this.isLoading = false
    this._flatAccounts = new Map()
  }

  uploadFileOnChange(files: FileList) {
    this.isLoading = true
    this.readAndParseTransactionsFromFile(files.item(0))
    .flatMap(tr => this._state.setTransactions(tr))
    .subscribe(
      transactions => {},
      e => {
        this.openErrorDialog(e)
        this.isLoading = false
      },
      () => {
        this.isLoading = false
        this.openDrawer.next(true)
      }
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

  private readAndParseTransactionsFromFile(file:File): Observable<Transaction[]> {
    let exploded = file.name.split(".")
    let ext = exploded[exploded.length - 1]

    if(ext == "ledger"){
      return this.readFileObservable(file)
      .flatMap(content => this._ledger.parseLedgerString(content))
    }
    else if(ext == "ofx"){
      return this.readFileObservable(file)
      .flatMap(content => this._ofx.parseOfxString(content))
    }
    else {
      return Observable.throw("Cette extension n'est pas autorisée")
    }
  }

  private readFileObservable(file: File): Observable<string> {
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
