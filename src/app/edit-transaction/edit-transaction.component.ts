import { Component, OnInit, Input, ViewChild } from '@angular/core'
import { JsonPipe } from '@angular/common';
import {MdDatepicker} from '@angular/material'
import { FormControl, FormGroup, FormBuilder, Validators, FormArray, ValidatorFn, AsyncValidatorFn, AbstractControl, ValidationErrors }            from '@angular/forms';

import {Observable, Subject} from 'rxjs'
import { Transaction, Posting } from '../models/models'
import { AppStateService } from '../app-state.service'

import * as moment from "moment"

@Component({
  selector: 'edit-transaction',
  templateUrl: './edit-transaction.component.html',
  styleUrls: ['./edit-transaction.component.css']
})
export class EditTransactionComponent implements OnInit {

  @ViewChild(MdDatepicker) myDatepicker: MdDatepicker<Date>;
  
  private transaction: Transaction | undefined

  isEditing: boolean
  group : FormGroup
  filteredAccounts: Subject<Account[]> = new Subject()
  formErrors: Observable<string>

  constructor(private _state: AppStateService, private _formBuilder: FormBuilder) { }

  ngOnInit(){
    this._state.editedTransaction().subscribe( tr => {
      this.transaction = tr
      this.isEditing = this.transaction != undefined
      this.init()
    });
  }

  createTransaction(){
    this.isEditing = true
    this.init()
  }

  createPostingGroup(): FormGroup{
    let accountFormControl = new FormControl('', Validators.required)

    accountFormControl.valueChanges
    .flatMap(v => this.filterAccount(v))
    .subscribe( accounts => this.filteredAccounts.next(accounts))

    return this._formBuilder.group({
      account: accountFormControl,
      amount: [null, Validators.pattern(/^-?\d+(\.\d+)?$/)],
      currency: [''],
      comment: ['']
    })
  }
  private init(){
      //Prepare form structure
      this.group = this._formBuilder.group({
        title: ['', [Validators.required]],
        date: ['', [Validators.required]],
        postings: this._formBuilder.array([])
      });
      
      let postingsControl = this.transaction ? this.transaction.postings.map(p => this.createPostingGroup()) : []
      this.group.setControl('postings', this._formBuilder.array(postingsControl, null, postingsRepartitionAsyncValidator()))

      //Initialize values
      let title = this.transaction ? this.transaction.header.title : ''
      let date = this.transaction ? this.transaction.header.date : moment()
      let postings = this.transaction ? this.transaction.postings.map( p => {
        return { 
          account: p.account,
          amount: p.amount ? p.amount.toString() : null,
          currency: p.currency,
          comment: p.comment
        }
      }) : []

      //Set all the values
      this.group.setValue({
        title: title,
        date: date,
        postings: postings
      })

      this.formErrors = Observable
      .of(this.logErrors(this.group))
      .concat(this.group.valueChanges.map( t => this.logErrors(this.group)))
      .do(e => console.log(e))
      .map(e => e[0])
      
      this.group.markAsDirty()
      this.group.updateValueAndValidity()
  }

  get postings(): FormArray {
    return this.group.get('postings') as FormArray;
  };

  filterAccount(query: any) : Observable<Account[]>{
    return this._state.allAccountsFlattened().map(accounts => {
      return accounts.filter(a => a.name.toLowerCase().indexOf(query.toLowerCase()) != -1)
    })
  }

  onSubmit() {
    let tr = this.prepareTransaction()
    this._state.createOrUpdateTransaction(tr).subscribe()
    this.closePanel()
  }

  revert() {
    this.init()
  }

  private prepareTransaction(): Transaction {
    const formModel = this.group.value
  
    let transaction : Transaction= {
      uuid: this.transaction ? this.transaction.uuid : undefined,
      header: {
        date: formModel.date,
        title: formModel.title,
        tag: ''
      },
      postings: formModel.postings.map(p => {
        return {
          tag: '',
          account: p.account,
          amount: p.amount ? Number.parseFloat(p.amount) : null,
          comment: p.comment,
          currency: p.currency
        } as Posting
      })
    }

    return transaction
  }

  logErrors(c: AbstractControl, id: string = "") : string[] {
    let e = c.errors
    let errors : string[] = []

    if(e != null){
      errors.push(id + ": " + JSON.stringify(e))
    }

    if(c instanceof FormGroup){ 
      Object.keys(c.controls).forEach(k => errors = errors.concat(this.logErrors(c.get(k)!, id+"/"+k)))
    }
    else if(c instanceof FormArray){
      c.controls.forEach((c, i) => errors = errors.concat(this.logErrors(c, id+"["+i+"]")))
    }

    return errors;
  }

  addPosting() {
    let postings = (this.group.get('postings') as FormArray)
    postings.push(this.createPostingGroup())
    postings.markAsDirty()
  }

  removePosting(index: number){
    let postings = (this.group.get('postings') as FormArray)
    postings.removeAt(index)
    postings.markAsDirty()
  }

  deleteTransaction(){
    this._state.deleteTransaction(this.transaction).subscribe()
  }

  closePanel(){
    this._state.setEditedTransaction(undefined).subscribe()
  }
}

export function postingsRepartitionAsyncValidator(): AsyncValidatorFn {
  return (array: FormArray): Observable<ValidationErrors | null> => {
    console.log("async")
    let accounts = new Set(array.controls.map(c => c.get('account')!.value as string).filter(a => a != ""))

    let error :ValidationErrors | null = null; 
    if(accounts.size < 2) {
      error = { 'notEnoughAccounts': 'minimum is 2'}
    }
    else {
      let amounts = array.controls.map(c => c.get('amount')!.value as string)      
      let howManyNulls = amounts.filter(a => a == null || a.trim() == '').length

      if(howManyNulls > 1){
        error = { 'onlyOneNullAmount': null }
      }
      else if(howManyNulls == 0) {
          let sum = amounts.filter(a => a != null && a.trim() != '').map(a => Number.parseFloat(a)).reduce((p, c) => p + c, 0)
          if(sum != 0){
            error = { 'incorrectBalance': sum }
          }
      }
    }
    return Observable.of(error)
  };
}