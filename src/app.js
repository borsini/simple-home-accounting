///<reference path="../typings/index.d.ts" />
class Period {
    constructor(startDate, endDate) {
        this._startDate = startDate; //Start date is inclusive
        this._endDate = endDate; //End date is exclusive
        this._stats = new Map();
    }
    get startDate() { return this._startDate; }
    get endDate() { return this._endDate; }
    get stats() { return this._stats; }
    getName() {
        return this._startDate.format("DD/MM/YYYY") + " - " + this._endDate.format("DD/MM/YYYY");
    }
}
var GroupBy;
(function (GroupBy) {
    GroupBy[GroupBy["Account"] = 1] = "Account";
    GroupBy[GroupBy["Year"] = 2] = "Year";
    GroupBy[GroupBy["Semester"] = 3] = "Semester";
    GroupBy[GroupBy["Trimester"] = 4] = "Trimester";
    GroupBy[GroupBy["Month"] = 5] = "Month";
    GroupBy[GroupBy["Week"] = 6] = "Week";
    GroupBy[GroupBy["Day"] = 7] = "Day";
})(GroupBy || (GroupBy = {}));
var StatParam;
(function (StatParam) {
    StatParam[StatParam["Sum"] = 1] = "Sum";
    StatParam[StatParam["Average"] = 2] = "Average";
})(StatParam || (StatParam = {}));
var PeriodGap;
(function (PeriodGap) {
    PeriodGap[PeriodGap["None"] = 1] = "None";
    PeriodGap[PeriodGap["Year"] = 2] = "Year";
    PeriodGap[PeriodGap["Month"] = 3] = "Month";
    PeriodGap[PeriodGap["Week"] = 4] = "Week";
    PeriodGap[PeriodGap["Day"] = 5] = "Day";
})(PeriodGap || (PeriodGap = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType[TransactionType["DEBT"] = 1] = "DEBT";
    TransactionType[TransactionType["CREDIT"] = 2] = "CREDIT";
    TransactionType[TransactionType["BOTH"] = 3] = "BOTH";
})(TransactionType || (TransactionType = {}));
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
    constructor(transactions) {
        this._transactions = [];
        this._grouping = GroupBy.Account;
        this._param = StatParam.Sum;
        this._visu = new GoogleChartsVisu();
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
    getAllTransactions() {
        return this._transactions;
    }
    getAllAccounts() {
        let accounts = new Set();
        this._transactions.forEach(tr => {
            tr.postings.forEach(ps => {
                accounts.add(ps.account);
                let sum = "";
                for (let entry of ps.account.split(":")) {
                    sum += entry;
                    accounts.add(sum);
                    sum += ":";
                }
            });
        });
        return Array.from(accounts).sort((a1, a2) => a1.localeCompare(a2));
    }
    addMissingAmount() {
        this._transactions.forEach(tr => {
            let totalSum = 0;
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
                incompletePosting.currency.amount = -totalSum;
            }
        });
    }
    analyzeTransactions(sourceAccount, toAccount, startDate, endDate, groupy, statParam, periodGap, numPeriods, transactionType, maxDepth) {
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
    isAccountEligible(account) {
        return !this._toAccount || account.indexOf(this._toAccount) >= 0;
    }
    analyzeTransaction(tr) {
        this._periods.forEach(period => {
            let transactionDate = moment(tr.header.date, "YYYY/MM/DD");
            if (transactionDate >= period.startDate && transactionDate < period.endDate) {
                let accountNames = tr.postings.map(p => p.account);
                let source = this._sourceAccount;
                let to = this._toAccount;
                let posting = tr.postings.find(function (p) {
                    return p.account.indexOf(source) >= 0;
                });
                if (posting) {
                    for (let p of tr.postings) {
                        if (p != posting && this.isAccountEligible(p.account)) {
                            let index;
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
                            let amount = posting.currency.amount || 0;
                            if (this._type == TransactionType.BOTH ||
                                (amount < 0 && this._type == TransactionType.DEBT) ||
                                (amount > 0 && this._type == TransactionType.CREDIT)) {
                                let stats = period.stats;
                                this.addStat(index, amount, stats);
                            }
                        }
                    }
                }
            }
        });
    }
    addStat(index, amount, stats) {
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
//# sourceMappingURL=app.js.map