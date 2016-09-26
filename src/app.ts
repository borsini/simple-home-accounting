///<reference path="../typings/index.d.ts" />

    class Period {
        private _startDate: moment.Moment;
        private _endDate: moment.Moment;
        private _stats: any;

        constructor(startDate: moment.Moment, endDate: moment.Moment) {
            this._startDate = startDate; //Start date is inclusive
            this._endDate = endDate; //End date is exclusive
            this._stats = new Map<string, number>();
        }
        get startDate(): moment.Moment { return this._startDate; }
        get endDate(): moment.Moment { return this._endDate; }
        get stats(): Map<string, number> { return this._stats; }

        getName() {
            return this._startDate.format("DD/MM/YYYY") + " - " + this._endDate.format("DD/MM/YYYY");
        }
    }

    interface Transaction {
        header: Header;
        postings: Array<Posting>;
    }

    interface Header {
        date: string;
        title: string;
    }

    interface Posting {
        account: string;
        currency: Currency;
    }

    interface Currency {
        amount: number;
        name: string;
    }

    enum GroupBy { Account = 1, Year, Semester, Trimester, Month, Week, Day }
    enum StatParam { Sum = 1, Average }
    enum PeriodGap { None = 1, Year, Month, Week, Day }
    enum TransactionType { DEBT = 1, CREDIT, BOTH }

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

    class Engine {
        private _transactions: Array<Transaction> = []
        private _sourceAccount: string; //Compte sur lesquel on réalise les stats
        private _toAccount: string;
        private _periods: Array<Period>;
        private _grouping = GroupBy.Account;
        private _param = StatParam.Sum;
        private _visu: GoogleChartsVisu = new GoogleChartsVisu();
        private _type: TransactionType;
        private _maxDepth : number;
        private _allAccounts: Map<string, number>;
        private _minDate: moment.Moment;
        private _maxDate: moment.Moment;
        private _currencies: Set<string>;

        constructor(transactions: Array<Transaction>) {
            this._periods = [];
            this._transactions = transactions;
            this._currencies = new Set();

            this.addMissingAmount();
            this.computeStats();
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

        computeStats() {
            this._allAccounts = new Map();
            this._transactions.forEach(tr => {

                let transactionDate = moment(tr.header.date, "YYYY/MM/DD");

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
                        let lastAmount = this._allAccounts.get(a) || 0;
                        this._allAccounts.set(a, lastAmount + ps.currency.amount);
                    });
                });
            });

            //this._allAccounts = Array.from(accounts).sort((a1, a2) => a1.localeCompare(a2));
        }

        get stats():Array<string>{
            return [
                this._transactions.length + " transactions sur " + this._allAccounts.size + " comptes " + " avec " + this._currencies.size + " monnaies",
                "entre le " + this._minDate.format("DD/MM/YYYY") + " et " + this._maxDate.format("DD/MM/YYYY"),
            ];
        }

        get transactions():Array<Transaction> {
            return this._transactions;
        }

        get accountsWithBalance() : Array<{ account: string, balance: number }> {
            let a : Array<{ account: string, balance: number }> = new Array();
            
            return a;
        }

        get allAccounts():Map<string, number> {
            return this._allAccounts;
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

        analyzeTransaction(tr: Transaction) {
            this._periods.forEach(
                period => {
                    let transactionDate: moment.Moment = moment(tr.header.date, "YYYY/MM/DD")
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


window.onload = () => {
    
};