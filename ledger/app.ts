///<reference path="typings/index.d.ts" />

    /**
    * @description determine if an array contains one or more items from another array.
    * @param {array} haystack the array to search.
    * @param {array} arr the array providing items to check for in the haystack.
    * @return {boolean} true|false if haystack contains at least one item from arr.
    */
    function findOne(haystack: Array<any>, arr: Array<any>) {
        return arr.some(function (v) {
            return haystack.indexOf(v) >= 0;
        });
    };

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
    }

    enum GroupBy { Account = 1, Year, Semester, Trimester, Month, Week, Day }
    enum StatParam { Sum = 1, Average }
    enum PeriodGap { None = 1, Year, Month, Week, Day }
    enum TransactionType { DEBT = 1, CREDIT, BOTH }

    class GoogleChartsVisu {
        drawPeriod(period: Period) {
            // Create the data table.
            let data = new google.visualization.DataTable();
            data.addColumn('string', 'Compte');
            data.addColumn('number', 'Total');

            Object.keys(period.stats).forEach(k => {
                let row: Array<google.visualization.ICell> = [];
                row.push({ v: k, f: null, p: null });
                row.push({ v: period.stats[k], f: null, p: null });

                data.addRow(row);
            });

            /*
            let title =
                this._sourceAccounts + ", "
                //      + fromDateInclusive + "-" + toDateInclusive
                + ", " + this._grouping
                + ", " + this._param;
            */

            // Set chart options

            var options = {
                /*'title': title,*/
                'pieSliceText': 'value',
                'width': 1000,
                'height': 300
            };


            let wrapper = new google.visualization.ChartWrapper({
                chartType: 'ColumnChart',
                dataTable: data,
                options: options,
                containerId: 'chart_div'
            });
            wrapper.draw(document.getElementById('chart_div'));

        }

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
                //isStacked: 'relative',
                isStacked: true,
                //interpolateNulls: true,
                title: 'Company Performance',
                hAxis: { title: 'Year', titleTextStyle: { color: '#333' } },
                vAxis: { minValue: 0 },
                pointsVisible: true
            };

            let wrapper = new google.visualization.ChartWrapper({
                chartType: 'AreaChart',
                dataTable: data,
                options: options,
                containerId: 'chart_div'
            });
            wrapper.draw();
        }
    }

    class Engine {
        private _transactions: Array<Transaction> = []
        private _sourceAccounts: Array<string>; //Comptes sur lesquels on réalise les stats
        private _periods: Array<Period>;
        private _grouping = GroupBy.Account;
        private _param = StatParam.Sum;
        private _visu: GoogleChartsVisu = new GoogleChartsVisu();
        private _type: TransactionType;

        constructor(transactions: Array<Transaction>) {
            this._sourceAccounts = [];
            this._periods = [];
            this._transactions = transactions;

            this.addMissingAmount();
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

        getAllAccounts(): Array<string> {
            let accounts: Set<string> = new Set();

            this._transactions.forEach(tr => {
                tr.postings.forEach(ps => {
                    accounts.add(ps.account);
                });
            });

            return Array.from(accounts).sort((a1, a2) => a1.localeCompare(a2));
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
            accounts: Array<string>,
            startDate: string,
            endDate: string,
            groupy: GroupBy,
            statParam: StatParam,
            periodGap: PeriodGap,
            numPeriods: number,
            transactionType: TransactionType) {
            this._sourceAccounts = accounts;
            this._periods = this.createPeriods(moment(startDate, "DD/MM/YYYY"), moment(endDate, "DD/MM/YYYY"), periodGap, numPeriods);
            this._grouping = groupy;
            this._param = statParam;
            this._type = transactionType;

            this._transactions.forEach(tr => this.analyzeTransaction(tr));

            if (this._periods.length == 1) {
                this._visu.drawPeriod(this._periods[0]);
            }
            else {
                this._visu.drawPeriods(this._periods);
            }
        }

        analyzeTransaction(tr: Transaction) {
            this._periods.forEach(
                period => {
                    let transactionDate: moment.Moment = moment(tr.header.date, "YYYY/MM/DD")
                    if (transactionDate >= period.startDate && transactionDate < period.endDate) {
                        let accountNames: Array<any> = tr.postings.map(p => p.account);

                        if (findOne(this._sourceAccounts, accountNames)) {
                            this._sourceAccounts.forEach(a => {
                                let posting = tr.postings.find(p => p.account == a);

                                if (posting) {
                                    let index: string;
                                    if (this._grouping == GroupBy.Account) {
                                        index = a;
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

                                        if (this._param == StatParam.Sum) {
                                            stats[index] = (stats[index] || 0) + amount;
                                        }
                                        else if (this._param == StatParam.Average) {
                                            stats[index] = stats[index] ? (stats[index] + amount) / 2 : amount;
                                        }
                                    }
                                }
                            });
                        }
                    }
                });
        }
    }


window.onload = () => {
    
};