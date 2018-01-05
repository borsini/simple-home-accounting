import Decimal from 'decimal.js';

export class Account {
    name: string;
    children: Set<Account>;
    balance: decimal.Decimal;
    childrenBalance: decimal.Decimal;
    nbTransactions: number;
    nbChildrenTransactions: number;
    debits: decimal.Decimal;
    credits: decimal.Decimal;
    childrenDebits: decimal.Decimal;
    childrenCredits: decimal.Decimal;

    constructor(n: string) {
        this.name = n;
        this.balance = new Decimal(0);
        this.childrenBalance = new Decimal(0);
        this.nbTransactions = 0;
        this.nbChildrenTransactions = 0;
        this.debits = new Decimal(0);
        this.credits = new Decimal(0);
        this.childrenDebits = new Decimal(0);
        this.childrenCredits = new Decimal(0);
        this.children = new Set();
    }
}
