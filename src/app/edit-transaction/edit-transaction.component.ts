import { Component, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl, AsyncValidatorFn, FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors,
  Validators,
} from '@angular/forms';
import { MdDatepicker } from '@angular/material';

import Decimal from 'decimal.js';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { AppStateService } from '../app-state.service';
import { Posting, Transaction } from '../models/models';

import * as moment from 'moment';
import 'rxjs/add/observable/concat';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/mergeMap';

@Component({
  selector: 'app-edit-transaction',
  styleUrls: ['./edit-transaction.component.css'],
  templateUrl: './edit-transaction.component.html',
})
export class EditTransactionComponent implements OnInit {

  @ViewChild(MdDatepicker) myDatepicker: MdDatepicker<Date>;

  private transaction: Transaction | undefined;

  isEditing: boolean;
  group: FormGroup;
  filteredAccounts: Subject<Account[]> = new Subject();
  formErrors: Observable<string>;

  constructor(private _state: AppStateService, private _formBuilder: FormBuilder) { }

  ngOnInit() {
    this._state.editedTransactionHotObservable().subscribe( tr => {
      this.transaction = tr;
      this.isEditing = this.transaction !== undefined;
      this.init();
    });
  }

  createTransaction() {
    this.isEditing = true;
    this.init();
  }

  createPostingGroup(): FormGroup {
    const accountFormControl = new FormControl('', Validators.required);

    accountFormControl.valueChanges
    .flatMap(v => this.filterAccount(v))
    .subscribe( accounts => this.filteredAccounts.next(accounts));

    return this._formBuilder.group({
      account: accountFormControl,
      amount: [null, Validators.pattern(/^-?\d+(\.\d+)?$/)],
      comment: [''],
      currency: [''],
    });
  }
  private init() {
      // Prepare form structure
      this.group = this._formBuilder.group({
        date: ['', [Validators.required]],
        postings: this._formBuilder.array([]),
        title: ['', [Validators.required]],
      });

      const postingsControl = this.transaction ? this.transaction.postings.map(p => this.createPostingGroup()) : [];
      this.group.setControl('postings', this._formBuilder.array(postingsControl, null, postingsRepartitionAsyncValidator()));

      // Initialize values
      const title = this.transaction ? this.transaction.header.title : '';
      const date = this.transaction ? this.transaction.header.date : moment();
      const postings = this.transaction ? this.transaction.postings.map( p => {
        return {
          account: p.account,
          amount: p.amount ? p.amount.toString() : null,
          comment: p.comment,
          currency: p.currency,
        };
      }) : [];

      // Set all the values
      this.group.setValue({
        date: date,
        postings: postings,
        title: title,
      });

      const errorObservable = Observable.of(this.logErrors(this.group));
      const groupErrors = this.group.valueChanges.map( t => this.logErrors(this.group));

    this.formErrors = Observable.concat(errorObservable, groupErrors)
      .do(e => console.log(e))
      .map(e => e[0]);

      this.group.markAsDirty();
      this.group.updateValueAndValidity();
  }

  get postings(): FormArray {
    return this.group.get('postings') as FormArray;
  }

  filterAccount(query: any): Observable<Account[]> {
    return this._state.allAccountsFlattenedHotObservable().map(accounts => {
      return accounts.filter(a => a.name.toLowerCase().indexOf(query.toLowerCase()) !== -1);
    });
  }

  onSubmit() {
    const tr = this.prepareTransaction();
    this._state.createOrUpdateTransactionColdObservable(tr).subscribe();
    this.closePanel();
  }

  revert() {
    this.init();
  }

  private prepareTransaction(): Transaction {
    const formModel = this.group.value;

    return {
      header: {
        date: formModel.date,
        tag: '',
        title: formModel.title,
      },
      postings: formModel.postings.map(p => {
        return {
          account: p.account,
          amount: p.amount ? new Decimal(p.amount) : null,
          comment: p.comment,
          currency: p.currency,
          tag: '',
        } as Posting;
      }),
      uuid: this.transaction ? this.transaction.uuid : undefined,
    };
  }

  logErrors(control: AbstractControl, id: string = ''): string[] {
    const e = control.errors;
    let errors: string[] = [];

    if (e != null) {
      errors.push(id + ': ' + JSON.stringify(e));
    }

    if (control instanceof FormGroup) {
      Object.keys(control.controls).forEach(k => {
        const c = control.get(k);
        if (c) {
          errors = errors.concat(this.logErrors(c, id + '/' + k));
        }
      });
    } else if (control instanceof FormArray) {
      control.controls.forEach((c, i) => errors = errors.concat(this.logErrors(c, id + '[' + i + ']')));
    }

    return errors;
  }

  addPosting() {
    const postings = (this.group.get('postings') as FormArray);
    postings.push(this.createPostingGroup());
    postings.markAsDirty();
  }

  removePosting(index: number) {
    const postings = (this.group.get('postings') as FormArray);
    postings.removeAt(index);
    postings.markAsDirty();
  }

  deleteTransaction() {
    this._state.deleteTransactionColdObservable(this.transaction).subscribe();
  }

  closePanel() {
    this._state.setEditedTransactionColdObservable(undefined).subscribe();
  }
}

export function postingsRepartitionAsyncValidator(): AsyncValidatorFn {
  return (array: FormArray): Observable<ValidationErrors | null> => {
    const accountControls = array.controls
      .map(c => c.get('account'))
      .filter(ac => ac != null)
      .map(ac => ac.value as string);
    const accounts = new Set(accountControls);

    let error: ValidationErrors | null = null;
    if (accounts.size < 2) {
      error = { 'notEnoughAccounts': 'minimum is 2'};
    } else {
      const amountControls = array.controls
        .map(c => c.get('amount'))
        .filter(ac => ac != null)
        .map(ac => ac.value as string);

      const howManyNulls = amountControls.filter(a => a == null || a.trim() === '').length;

      if (howManyNulls > 1) {
        error = { 'onlyOneNullAmount': null };
      } else if (howManyNulls === 0) {
          const sum = amountControls.filter(a => a != null && a.trim() !== '').map(a => Number.parseFloat(a)).reduce((p, c) => p + c, 0);
          if (sum !== 0) {
            error = { 'incorrectBalance': sum };
          }
      }
    }
    return Observable.of(error);
  };
}
