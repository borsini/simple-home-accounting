import * as moment from "moment";

export interface Transaction {
    uuid: string | undefined
    header: Header
    postings: Array<Posting>
}

interface Header {
    date: moment.Moment
    title: string
    tag?: string
}

export interface Posting {
    tag?: string
    account: string
    amount?: number
    currency?: string
    comment?: string
}

export class Account {
    name: string
    children: Set<Account>;
    balance: number
    childrenBalance: number
    nbTransactions: number
    nbChildrenTransactions: number
    debits: number
    credits: number
    childrenDebits: number
    childrenCredits: number

    constructor(n: string) {
        this.name = n;
        this.balance = 0
        this.childrenBalance = 0
        this.nbTransactions = 0
        this.nbChildrenTransactions = 0
        this.debits = 0
        this.credits = 0
        this.childrenDebits = 0
        this.childrenCredits = 0
        this.children = new Set()
    }
}