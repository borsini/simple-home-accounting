///<reference path="../typings/index.d.ts" />

class Period {
    private _startDate: moment.Moment
    private _endDate: moment.Moment
    private _stats: Map<string, number>

    constructor(startDate: moment.Moment, endDate: moment.Moment) {
        this._startDate = startDate //Start date is inclusive
        this._endDate = endDate //End date is exclusive
        this._stats = new Map<string, number>()
    }
    get startDate(): moment.Moment { return this._startDate }
    get endDate(): moment.Moment { return this._endDate }
    get stats(): Map<string, number> { return this._stats }

    getName() {
        return this._startDate.format("DD/MM/YYYY") + " - " + this._endDate.format("DD/MM/YYYY")
    }
}

interface Transaction {
    header: Header
    postings: Array<Posting>
}

interface Header {
    date: string
    title: string
    tag: string
}

interface Posting {
    tag: string
    account: string
    amount: number
    currency: string
    comment: string
}

class Account {
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

enum GroupBy { Account = 1, Year, Semester, Trimester, Month, Week, Day }
enum StatParam { Sum = 1, Average }
enum PeriodGap { None = 1, Year, Month, Week, Day }
enum TransactionType { DEBT = 1, CREDIT, BOTH }
enum SelectionBehavior { UNION = 1, INTERSECTION }

interface ChartJsData {
    labels: string[]
    datasets: ChartJsDataset[]
}
interface ChartJsDataset {
    data: any[],
    borderWidth?: number,
    backgroundColor?: string[]
}
