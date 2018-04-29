import { postingsRepartitionAsyncValidator } from '../edit-transaction.component';
import { FormBuilder, FormArray, FormGroup } from '@angular/forms';

const createPostingGroup = (b: FormBuilder): FormGroup => {
  return b.group({
    account: [''],
    amount: [null],
    comment: [''],
    currency: [''],
  });
};

const createPostingGroupWithValue = (b: FormBuilder, account: string, amount: string | null, comment: string, currency: string) => {
  const g = createPostingGroup(b);
  g.setValue({account, amount, comment, currency});
  return g;
};

describe(postingsRepartitionAsyncValidator.name, () => {
  it('returns error when no postings', (done) => {
    const postings = new FormArray([]);
    const res = postingsRepartitionAsyncValidator(postings).toPromise();

    res.then( errors => {
      expect(errors).toMatchSnapshot();
      done();
    });
  });

  it('returns error when one empty posting', (done) => {
    const b = new FormBuilder();
    const postingGroup = createPostingGroup(b);
    const postings = new FormArray([postingGroup]);

    const res = postingsRepartitionAsyncValidator(postings).toPromise();

    res.then( errors => {
      expect(errors).toMatchSnapshot();
      done();
    });
  });

  it('returns error when more than one empty amount', (done) => {
    const b = new FormBuilder();
    const p1 = createPostingGroupWithValue(b, 'Expenses', null, '', '');
    const p2 = createPostingGroupWithValue(b, 'Income', ' ', '', '');

    const postings = new FormArray([p1, p2]);

    const res = postingsRepartitionAsyncValidator(postings).toPromise();

    res.then( errors => {
      expect(errors).toMatchSnapshot();
      done();
    });
  });

  it('returns error when balance is incorrect', (done) => {
    const b = new FormBuilder();
    const p1 = createPostingGroupWithValue(b, 'Expenses', '3.14', '', '');
    const p2 = createPostingGroupWithValue(b, 'Income', '-3.15', '', '');

    const postings = new FormArray([p1, p2]);

    const res = postingsRepartitionAsyncValidator(postings).toPromise();

    res.then( errors => {
      expect(errors).toMatchSnapshot();
      done();
    });
  });

  it('returns no error with one amount set', (done) => {
    const b = new FormBuilder();
    const p1 = createPostingGroupWithValue(b, 'Expenses', '3.14', '', '');
    const p2 = createPostingGroupWithValue(b, 'Income', null, '', '');

    const postings = new FormArray([p1, p2]);

    const res = postingsRepartitionAsyncValidator(postings).toPromise();

    res.then( errors => {
      expect(errors).toBeNull();
      done();
    });
  });

  it('returns no error with all amounts sets', (done) => {
    const b = new FormBuilder();
    const p1 = createPostingGroupWithValue(b, 'Expenses', '3.14', '', '');
    const p2 = createPostingGroupWithValue(b, 'Income', '-3.14', '', '');

    const postings = new FormArray([p1, p2]);

    const res = postingsRepartitionAsyncValidator(postings).toPromise();

    res.then( errors => {
      expect(errors).toBeNull();
      done();
    });
  });
});
