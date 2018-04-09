import { NgRedux } from '@angular-redux/store';
import { Component, OnInit, ViewChild, Input } from '@angular/core';
import {
  AbstractControl, AsyncValidatorFn, FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors,
  Validators,
  ValidatorFn,
} from '@angular/forms';
import { MatDatepicker } from '@angular/material';

import Decimal from 'decimal.js';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Transaction, TransactionWithUUID, isTransactionWithUUID } from '../../shared/models/transaction';

import * as moment from 'moment';
import 'rxjs/add/observable/concat';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/mergeMap';
import { Posting } from '../../shared/models/posting';
import { AppState } from '../../shared/models/app-state';
import {
  AppStateActions,
} from '../../shared/reducers/app-state-reducer';
import {
  editedTransactionSelector,
  isTransactionPanelOpenSelector,
  allAccountsSelector,
  tabsSelector,
} from '../../shared/selectors/selectors';
import { Account } from '../../shared/models/account';
import { UndoRedoState, presentSelector } from '../../shared/reducers/undo-redo-reducer';


interface AllErrors { [control: string]: ValidationErrors; }

@Component({
  selector: 'app-edit-transaction',
  styleUrls: ['./edit-transaction.component.css'],
  templateUrl: './edit-transaction.component.html',
})
export class EditTransactionComponent implements OnInit {

  @Input() tabId: string;
  @ViewChild(MatDatepicker) myDatepicker: MatDatepicker<Date>;

  transactionToEdit?: TransactionWithUUID | Transaction;
  isPanelOpen: Observable<boolean>;
  group: FormGroup;
  filteredAccounts: Subject<Account[]> = new Subject();
  formErrors: Observable<string>;
  required: {'required': true};

  constructor(private ngRedux: NgRedux<UndoRedoState<AppState>>, private _formBuilder: FormBuilder) { }

  ngOnInit() {
    this.ngRedux.select(presentSelector(editedTransactionSelector(this.tabId))).subscribe( tr => {
      this.transactionToEdit = tr;
      this.init();
    });

    this.isPanelOpen = this.ngRedux.select(presentSelector(isTransactionPanelOpenSelector(this.tabId)));
  }

  createTransaction() {
    this.ngRedux.dispatch(AppStateActions.setEditedTransaction({
      header: {
        date: moment.utc().unix(),
        title: '',
      },
      postings: [
        {
          account: '',
        },
        {
          account: '',
        },
      ],
    }, this.tabId));
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

      const postingsControl = this.transactionToEdit ? this.transactionToEdit.postings.map(p => this.createPostingGroup()) : [];
      this.group.setControl('postings', this._formBuilder.array(postingsControl, null, postingsRepartitionAsyncValidator()));

      // Initialize values
      const title = this.transactionToEdit ? this.transactionToEdit.header.title : '';
      const date = this.transactionToEdit ? moment.unix(this.transactionToEdit.header.date) : moment();
      const postings = this.transactionToEdit ? this.transactionToEdit.postings.map( p => {
        return {
          account: p.account,
          amount: p.amount ? p.amount.toString() : null,
          comment: p.comment || '',
          currency: p.currency || '',
        };
      }) : [];

      this.formErrors = Observable.concat( Observable.of(1), this.group.valueChanges)
      .map( t => this.getAllErrors(this.group))
      .map(this.errorsToString)
      .map(e => e[0]);

      this.group.statusChanges.do(s => console.log('status' + s)).subscribe();

      // Set all the values
      this.group.setValue({
        date: date,
        postings: postings,
        title: title,
      });


      markFormGroupTouched(this.group);
  }

  errorsToString = (errors: AllErrors): string[] => {
    console.log(errors);
    return Object.keys(errors)
    .map(k => errors[k])
    .map(v => Object.keys(v)[0])
    .map(s => s);
  }

  get postings(): FormArray {
    return this.group.get('postings') as FormArray;
  }

  filterAccount(query: string): Observable<Account[]> {
    const latinizedQuery = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    return this.ngRedux.select(presentSelector(allAccountsSelector))
    .map(accounts => {
      return Object.values(accounts).filter(a => {
        const latinizedAccount = a.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return latinizedAccount.toLowerCase().indexOf(latinizedQuery.toLowerCase()) !== -1;
      });
    });
  }

  onSubmit() {
    if (this.group.valid) {
      const tr = this.prepareTransaction();

      if (!this.transactionToEdit) { return; }

      if (isTransactionWithUUID(this.transactionToEdit)) {
        const modifiedTransaction = {
          ...tr,
          uuid: this.transactionToEdit.uuid,
        };
        this.ngRedux.dispatch(AppStateActions.updateTransaction(modifiedTransaction));
      } else {
        this.ngRedux.dispatch(AppStateActions.addTransactions([tr]));
      }

      this.closePanel();
    }
  }

  revert() {
    this.init();
  }

  private prepareTransaction(): Transaction {
    const formModel = this.group.value;

    return {
      header: {
        date: formModel.date.unix(),
        tag: '',
        title: formModel.title,
      },
      postings: formModel.postings.map(p => {
        return {
          account: p.account,
          amount: p.amount,
          comment: p.comment,
          currency: p.currency,
          tag: '',
        } as Posting;
      }),
    };
  }

  getAllErrors(control: AbstractControl, id: string = ''): AllErrors {
    const e = control.errors;
    let errors: { [control: string]: ValidationErrors } = {};


    if (e != null) {
      errors[id] = e;
    }

    if (control instanceof FormGroup) {
      Object.keys(control.controls).forEach(k => {
        const c = control.get(k);
        if (c) {
          const childErrors = this.getAllErrors(c, id + '/' + k);
          errors = { ...errors, ...childErrors };
        }
      });
    } else if (control instanceof FormArray) {
      control.controls.forEach((c, i) => {
        const childErrors = this.getAllErrors(c, id + '[' + i + ']');
        errors = { ...errors, ...childErrors };
      });
    }

    return errors;
  }

  addPosting() {
    const postings = (this.group.get('postings') as FormArray);
    const g = this.createPostingGroup();
    postings.push(g);
    markFormGroupTouched(g);
  }

  removePosting(index: number) {
    const postings = (this.group.get('postings') as FormArray);
    postings.removeAt(index);
    postings.markAsDirty();
  }

  deleteTransaction() {
    if (isTransactionWithUUID(this.transactionToEdit)) {
      this.ngRedux.dispatch(AppStateActions.deleteTransaction(this.transactionToEdit.uuid));
    }
  }

  closePanel() {
    this.ngRedux.dispatch(AppStateActions.setEditedTransaction(undefined, this.tabId));
  }
}

 /**
   * Marks all controls in a form group as touched
   * @param formGroup - The group to caress..hah
   */
  function markFormGroupTouched(formGroup: FormGroup) {
    (<any> Object).values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control.controls) {
        control.controls.forEach(c => markFormGroupTouched(c));
      }
    });
  }

export function postingsRepartitionAsyncValidator(): AsyncValidatorFn {
  return (array: FormArray): Observable<ValidationErrors | null> => {
    const accountControls = array.controls
      .map(c => c.get('account'))
      .filter(ac => ac != null)
      // tslint:disable-next-line no-non-null-assertion
      .map(ac => ac!.value as string);
    const accounts = new Set(accountControls);

    let error: ValidationErrors | null = null;
    if (accounts.size < 2) {
      error = { 'notEnoughAccounts': 'minimum is 2'};
    } else {
      const amountControls = array.controls
        .map(c => c.get('amount'))
        .filter(ac => ac != null)
        // tslint:disable-next-line no-non-null-assertion
        .map(ac => ac!.value as string);

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
