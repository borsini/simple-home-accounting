import { Injectable } from '@angular/core';
import from './parser_ledger.js';


class GoogleChartsVisu {

        drawPeriods(periods) {
            var data = new google.visualization.DataTable();

            var indexes = new Set();

            periods.forEach(p => {
                Object.keys(p.stats).forEach(k => {
                    indexes.add(k);
                });
            });

            data.addColumn('string', 'Période');

            indexes.forEach(index => {
                data.addColumn('number', index);
            });

            periods.forEach(p => {
                let rowValues = [p.getName()].concat(Array.from(indexes).map(index => p.stats[index]));
                data.addRow(rowValues);
            });

            var options = {
                isStacked: true,
                width: 1000,
                legend: { position: 'top', maxLines: 3 },
                height: 1000
            };

            let wrapper = new google.visualization.ChartWrapper({
                chartType: 'ColumnChart',
                dataTable: data,
                options: options,
                containerId: 'chart_div'
            });
            wrapper.draw();
        }
    }

@Injectable()
export class LedgerService {

    private _transactions: Array<Transaction> = [];
    private _allAccounts: Array<Account>;

    private _sourceAccount: string; //Compte sur lesquel on réalise les stats
    private _toAccount: string;
    private _periods: Array<Period>;
    private _grouping = GroupBy.Account;
    private _param = StatParam.Sum;
    private _visu: GoogleChartsVisu = new GoogleChartsVisu();
    private _type: TransactionType;
    private _maxDepth : number;
    private _minDate: moment.Moment;
    private _maxDate: moment.Moment;
    private _currencies: Set<string>;

    constructor() {
        this._periods = [];
        this._transactions = [];
        this._currencies = new Set();
        this.addMissingAmount();
    }

    openFile(name: Blob, callback: () => any){
        var reader = new FileReader();

        let me = this;
                reader.addEventListener('load', function () {
                    me._transactions = PARSER.parse(reader.result).sort( (tr1: Transaction, tr2: Transaction) => {
                        let d1 = me.getTransactionDate(tr1);
                         let d2 = me.getTransactionDate(tr2);
                         if (d2 > d1) return 1;
                         else if (d2 < d1) return -1;
                         else return 0;
                    });
                    me.computeStats();
                    callback();
                });

        reader.readAsText(name);
    }

    createPeriods(startDate, endDate, gap, gapMultiple) {
        let from = startDate.clone();
        let periods = [];

        while (from < endDate) {
            let to;

            if (gap == PeriodGap.Year) {
                to = from.clone().add(gapMultiple, 'year');
            }
            else if (gap == PeriodGap.Month) {
                to = from.clone().add(gapMultiple, 'month');
            }
            else if (gap == PeriodGap.Week) {
                to = from.clone().add(gapMultiple, 'week');
            }
            else if (gap == PeriodGap.Day) {
                to = from.clone().add(gapMultiple, 'day');
            }
            else {
                to = endDate;
            }
            periods.push(new Period(from, moment.min(to, endDate)));

            from = to.clone();
        }

        return periods;
    }

    private getTransactionDate(tr: Transaction) : moment.Moment {
        return moment(tr.header.date, "YYYY/MM/DD");
    }

    computeStats() {
        let accountsAndBalance = new Map<string, number>();
        this._transactions.forEach(tr => {

            let transactionDate = this.getTransactionDate(tr);

            this._minDate =  this._minDate ? moment.min( this._minDate, transactionDate) : transactionDate;
                this._maxDate =  this._maxDate ? moment.max( this._maxDate, transactionDate) : transactionDate;

            tr.postings.forEach(ps => {
                if(ps.currency.name){
                    this._currencies.add(ps.currency.name);
                }

                let accountsToAddAmount : Array<string> = [];

                if(ps.account.indexOf(":") > 0){
                    let sum: string = "";
                    for (let entry of ps.account.split(":")) {
                        sum += entry;
                        accountsToAddAmount.push(sum);
                        sum += ":";
                    }
                }
                else{
                    accountsToAddAmount.push(ps.account);
                }
                
                accountsToAddAmount.forEach(a => {
                    let lastAmount = accountsAndBalance.get(a) || 0;
                    accountsAndBalance.set(a, lastAmount + ps.currency.amount);
                });
            });
        });

        this._allAccounts = Array.from(accountsAndBalance).map( e => {
            return {
                name : e[0],
                balance : e[1]
            }
        }).sort( (a1, a2) => a1.name.localeCompare(a2.name) );
    }

    get stats():Array<string>{
        return [
            this._transactions.length + " transactions sur " + this._allAccounts.length + " comptes " + " avec " + this._currencies.size + " monnaies",
            "entre le " + this._minDate.format("DD/MM/YYYY") + " et " + this._maxDate.format("DD/MM/YYYY"),
        ];
    }

    get transactions():Array<Transaction> {
        return this._transactions;
    }

    get allAccounts(): Account[] {
        return this._allAccounts;
    }

    filterTransactions(account: string, startDate: moment.Moment, endDate: moment.Moment){
        return this._transactions.filter( tr => {
            let isValid: boolean = true;

            let trDate = this.getTransactionDate(tr);
            if(startDate){
                isValid = isValid && trDate.isSameOrAfter(startDate);
            }

            if(endDate){
                isValid = isValid && trDate.isSameOrBefore(endDate);
            }

            if(account){
                isValid = isValid && (tr.postings.find( p => p.account == account) != null);
            }

            return isValid;
        });
    }

    addMissingAmount() {
        this._transactions.forEach(tr => {

            let totalSum: number = 0;
            let incompletePosting;

            tr.postings.forEach(ps => {
                if (ps.currency.amount) {
                    totalSum += ps.currency.amount;
                }
                else {
                    incompletePosting = ps;
                }
            });

            if (incompletePosting) {
                incompletePosting.currency.amount = - totalSum;
            }
        });
    }

    analyzeTransactions(
        sourceAccount: string,
        toAccount: string,
        startDate: string,
        endDate: string,
        groupy: GroupBy,
        statParam: StatParam,
        periodGap: PeriodGap,
        numPeriods: number,
        transactionType: TransactionType,
        maxDepth: number) {
        this._sourceAccount = sourceAccount;
        this._toAccount = toAccount;
        this._periods = this.createPeriods(moment(startDate, "DD/MM/YYYY"), moment(endDate, "DD/MM/YYYY"), periodGap, numPeriods);
        this._grouping = groupy;
        this._param = statParam;
        this._type = transactionType;
        this._maxDepth = maxDepth;

        this._transactions.forEach(tr => this.analyzeTransaction(tr));
        this._visu.drawPeriods(this._periods);
    }

    isAccountEligible(account: string) : boolean {
        return !this._toAccount || account.indexOf(this._toAccount) >= 0;
    }

    getOutString(): string {
        let out : string = "";

        this._transactions.forEach( tr => {
            out += tr.header.date + " " + tr.header.title + "\n";
            
            tr.postings.forEach( p => {
                out += "    ";
                out += p.account + "    " + p.currency.name + " " + p.currency.amount;
                out += p.comment ? " ; " + p.comment : "";
                out += "\n";
            });

            out += "\n";
        });

        return out;
    }

    analyzeTransaction(tr: Transaction) {
        this._periods.forEach(
            period => {
                let transactionDate: moment.Moment = this.getTransactionDate(tr);
                if (transactionDate >= period.startDate && transactionDate < period.endDate) {
                    let accountNames: Array<any> = tr.postings.map(p => p.account);
                    let source = this._sourceAccount;
                    let to = this._toAccount;
                    let posting =  tr.postings.find(function (p) {
                        return p.account.indexOf(source) >= 0;
                    });

                    if(posting){
                        for(let p of tr.postings){
                            if( p != posting && this.isAccountEligible(p.account)){
                                let index: string;
                                if (this._grouping == GroupBy.Account) {
                                    index = p.account.split(":", this._maxDepth).join(":");
                                }
                                else if (this._grouping == GroupBy.Year) {
                                    index = String(transactionDate.year());
                                }
                                else if (this._grouping == GroupBy.Semester) {

                                    index = String(Math.floor(transactionDate.month() / 6));
                                }
                                else if (this._grouping == GroupBy.Trimester) {
                                    index = String(Math.floor(transactionDate.month() / 3));
                                }
                                else if (this._grouping == GroupBy.Month) {
                                    index = String(transactionDate.month());
                                }
                                else if (this._grouping == GroupBy.Week) {
                                    index = String(transactionDate.week());
                                }
                                else if (this._grouping == GroupBy.Day) {
                                    index = String(transactionDate.weekday());
                                }

                                let amount: number = posting.currency.amount || 0;

                                if (this._type == TransactionType.BOTH ||
                                    (amount < 0 && this._type == TransactionType.DEBT) ||
                                    (amount > 0 && this._type == TransactionType.CREDIT)) {
                                    
                                    let stats: Map<string, number> = period.stats;
                                    this.addStat(index, amount, stats);
                                }
                            }
                        }
                    }
                }
            });
    }

    addStat(index: string, amount: number, stats: Map<string, number>){
        if (this._param == StatParam.Sum) {
            stats[index] = (stats[index] || 0) + amount;
        }
        else if (this._param == StatParam.Average) {
            stats[index] = stats[index] ? (stats[index] + amount) / 2 : amount;
        }
    }
}