import Decimal from 'decimal.js';

export class Account {
    name: string;
    children: string[];
    parent?: string;
    balance: Decimal;
    childrenBalance: Decimal;
    nbTransactions: number;
    nbChildrenTransactions: number;
    debits: Decimal;
    credits: Decimal;
    childrenDebits: Decimal;
    childrenCredits: Decimal;

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
        this.children = [];
    }

    plus(a: Account) {
        if(a.name != this.name || a.parent != this.parent) {
            throw "Can only add accounts with the exact same name and parent"
        }

        const acc = new Account(a.name)
        acc.children = Array.from(new Set([...this.children, ...a.children]))
        .sort((a, b) => a.localeCompare(b))
        acc.balance = this.balance.plus(a.balance);
        acc.childrenBalance = this.childrenBalance.plus(a.childrenBalance);
        acc.nbTransactions += this.nbTransactions + a.nbTransactions;
        acc.nbChildrenTransactions = this.nbChildrenTransactions + a.nbChildrenTransactions;
        acc.debits = this.debits.plus(a.debits);
        acc.credits = this.credits.plus(a.credits);
        acc.childrenDebits = this.childrenDebits.plus(a.childrenDebits);
        acc.childrenCredits = this.childrenCredits.plus(a.childrenCredits);
        if(this.parent) acc.parent = this.parent
        
        return acc;
    }

    minus(a: Account) {
        if(a.name != this.name || a.parent != this.parent) {
            throw "Can only substract accounts with the exact same name and parent"
        }

        const acc = new Account(a.name)
        acc.children = this.children
        acc.balance = this.balance.minus(a.balance);
        acc.childrenBalance = this.childrenBalance.minus(a.childrenBalance);
        acc.nbTransactions += this.nbTransactions - a.nbTransactions;
        acc.nbChildrenTransactions = this.nbChildrenTransactions - a.nbChildrenTransactions;
        acc.debits = this.debits.minus(a.debits);
        acc.credits = this.credits.minus(a.credits);
        acc.childrenDebits = this.childrenDebits.minus(a.childrenDebits);
        acc.childrenCredits = this.childrenCredits.minus(a.childrenCredits);
        if(this.parent) acc.parent = this.parent
        
        return acc;
    }
}
