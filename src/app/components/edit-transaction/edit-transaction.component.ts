import { NgRedux } from '@angular-redux/store';
import { Component, OnInit, ViewChild, Input } from '@angular/core';
import {
  AbstractControl, AsyncValidatorFn, FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors,
  Validators,
  ValidatorFn,
} from '@angular/forms';
import { MatDatepicker, ErrorStateMatcher } from '@angular/material';

import Decimal from 'decimal.js';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Transaction, TransactionWithUUID, isTransactionWithUUID } from '../../shared/models/transaction';

import * as moment from 'moment';
import { filter } from 'rxjs/operators';
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

const REQUIRED = 'required';
const NOT_ENOUGH_ACCOUNTS = 'notEnoughAccounts';
const ONLY_ONE_NULL = 'onlyOneNullAmount';
const INCORRECT_BALANCE = 'incorrectBalance';
const PICKER_PARSING = 'matDatepickerParse';

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
  titleErrors: Observable<string>;
  dateErrors: Observable<string>;
  postingsErrors: Observable<string>;
  postingAccountErrors: (p: number) => Observable<string>;
  postingAmountErrors: (p: number) => Observable<string>;
  postingCommentErrors: (p: number) => Observable<string>;

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
        isVerified: false,
        tags: [],
      },
      postings: [
        {
          account: '',
          tags: [],
        },
        {
          account: '',
          tags: [],
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
        tags: this._formBuilder.array([]),
      });

      //Prepare date
      const date = this.transactionToEdit ? moment.unix(this.transactionToEdit.header.date) : moment();

      //Prepare title
      const title = this.transactionToEdit ? this.transactionToEdit.header.title : '';

      //Prepare postings
      const nbPostings = this.transactionToEdit ? Math.max(this.transactionToEdit.postings.length, 2) : 0;
      const postingsControl = this.transactionToEdit ? Array(nbPostings).fill(0).map(p => this.createPostingGroup()) : [];
      this.group.setControl('postings', this._formBuilder.array(postingsControl, null, postingsRepartitionAsyncValidator));
      const postings = this.transactionToEdit ? postingsControl.map( (c, i) => {
        const p = this.transactionToEdit!.postings[i];
        return {
          account: p && p.account || '',
          amount: p && p.amount ? p.amount.toString() : null,
          comment: p && p.comment || '',
          currency: p && p.currency || '',
        };
      }) : [];

      //Prepare tags
      const nbTags = this.transactionToEdit ? this.transactionToEdit.header.tags.length : 0;
      const tagsControl = this.transactionToEdit ? Array(nbTags).fill(0).map(p => this._formBuilder.control('')) : [];
      
      this.group.setControl('tags', this._formBuilder.array(tagsControl));
      const tags = this.transactionToEdit ? this.transactionToEdit.header.tags : []
      
      // Initialize errors
      const allErrors = Observable.concat( Observable.of(1), this.group.valueChanges)
      .map( t => this.getAllErrors(this.group))
      .map(this.errorsToString);

      this.titleErrors = this.errorsForControl('/title')(allErrors);
      this.dateErrors = this.errorsForControl('/date')(allErrors);
      this.postingsErrors = this.errorsForControl('/postings')(allErrors);
      this.postingAccountErrors = (p: number) => this.errorsForControl(`/postings[${p}]/account`)(allErrors);
      this.postingAmountErrors = (p: number) => this.errorsForControl(`/postings[${p}]/amount`)(allErrors);
      this.postingCommentErrors = (p: number) => this.errorsForControl(`/postings[${p}]/comment`)(allErrors);

      // Set all the values
      this.group.setValue({ date, postings, title, tags });
      markFormGroupTouched(this.group);
  }

  errorsForControl = (control: string) => (o: Observable<{ [control: string]: string[] }>): Observable<string> => {
    return o.map(errors => errors[control] || [])
    .map(e => e.join(', '));
  }

  errorCodeToString = (errorCode: string): string => {
    switch (errorCode) {
      case REQUIRED:
        return 'Champ obligatoire';
      case NOT_ENOUGH_ACCOUNTS:
        return 'Un minimum de 2 comptes est requis';
      case INCORRECT_BALANCE:
         return 'La balance doit être égale à 0';
      case ONLY_ONE_NULL:
         return 'Une seule ligne peut avoir un montant nul';
      case PICKER_PARSING:
         return 'Format invalide';
      default:
        return `Erreur inconnue (${errorCode})`;
    }
  }

  validationErrorsToStrings = (errors: ValidationErrors): string[] => (Object.keys(errors).map(this.errorCodeToString));

  errorsToString = (errors: { [control: string]: ValidationErrors; }): { [control: string]: string[] } => {
    return Object.keys(errors).reduce(
      (prev, controlName) => ({...prev, [controlName]: this.validationErrorsToStrings(errors[controlName])}), {});
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
        isVerified: false, // each time we modifiy a transaction, we invalidate it's status
        title: formModel.title,
        tags: formModel.tags,
      },
      postings: formModel.postings.map(p => {
        return {
          account: p.account,
          amount: p.amount,
          comment: p.comment,
          currency: p.currency,
          tag: '',
          tags: [],
        } as Posting;
      }),
    };
  }

  getAllErrors(control: AbstractControl, id: string = ''): { [control: string]: ValidationErrors; } {
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

  removeHeaderTag(tagIndex: number) {
    const formTags = this.group.get('tags') as FormArray;
    formTags.removeAt(tagIndex);
    formTags.markAsDirty();
  }

  canAddHeaderTag(tag: string) : boolean {
    const tags = this.group.get('tags') as FormArray;
    const v = tags.getRawValue() as string[]
    return this.transactionToEdit != null && !v.includes(tag)
  }

  addHeaderTag(tagName: string) {
    if(this.canAddHeaderTag(tagName)) {
      const formTags = this.group.get('tags') as FormArray;
      const control = this._formBuilder.control(tagName)
      formTags.push(control)
      
      formTags.markAsDirty()
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
    if(!formGroup.controls) return;

    (<any> Object).values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control.controls) {
        control.controls.forEach(c => markFormGroupTouched(c));
      }
    });
  }

export const postingsRepartitionAsyncValidator = (array: FormArray): Observable<ValidationErrors | null> => {
  const accountControls = array.controls
    .map(c => c.get('account'))
    .filter(ac => ac != null)
    // tslint:disable-next-line no-non-null-assertion
    .map(ac => ac!.value as string);
  const accounts = new Set(accountControls);

  let error: ValidationErrors | null = null;
  if (accounts.size < 2) {
    error = { [NOT_ENOUGH_ACCOUNTS]: 'minimum is 2'};
  } else {
    const amountControls = array.controls
      .map(c => c.get('amount'))
      .filter(ac => ac != null)
      // tslint:disable-next-line no-non-null-assertion
      .map(ac => ac!.value as string);

    const howManyNulls = amountControls.filter(a => a == null || a.trim() === '').length;

    if (howManyNulls > 1) {
      error = { [ONLY_ONE_NULL]: null };
    } else if (howManyNulls === 0) {
        const sum = amountControls.filter(a => a != null && a.trim() !== '')
        .map(a => new Decimal(a))
        .reduce((p, c) => p.plus(c), new Decimal(0));
        if (!sum.isZero()) {
          error = { [INCORRECT_BALANCE]: sum };
        }
    }
  }
  return Observable.of(error);
};
