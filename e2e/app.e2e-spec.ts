import { LedgerPage } from './app.po';

describe('ledger App', () => {
  let page: LedgerPage;

  beforeEach(() => {
    page = new LedgerPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
