///<reference path="../typings/index.d.ts" />
/**
* @description determine if an array contains one or more items from another array.
* @param {array} haystack the array to search.
* @param {array} arr the array providing items to check for in the haystack.
* @return {boolean} true|false if haystack contains at least one item from arr.
*/
function findOne(haystack, arr) {
    return arr.some(function (v) {
        return haystack.indexOf(v) >= 0;
    });
}
;
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
    drawPeriod(period) {
        // Create the data table.
        let data = new google.visualization.DataTable();
        data.addColumn('string', 'Compte');
        data.addColumn('number', 'Total');
        Object.keys(period.stats).forEach(k => {
            let row = [];
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
    constructor(transactions) {
        this._transactions = [];
        this._grouping = GroupBy.Account;
        this._param = StatParam.Sum;
        this._visu = new GoogleChartsVisu();
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
    getAllAccounts() {
        let accounts = new Set();
        this._transactions.forEach(tr => {
            tr.postings.forEach(ps => {
                accounts.add(ps.account);
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
    analyzeTransactions(accounts, startDate, endDate, groupy, statParam, periodGap, numPeriods, transactionType) {
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
    analyzeTransaction(tr) {
        this._periods.forEach(period => {
            let transactionDate = moment(tr.header.date, "YYYY/MM/DD");
            if (transactionDate >= period.startDate && transactionDate < period.endDate) {
                let accountNames = tr.postings.map(p => p.account);
                if (findOne(this._sourceAccounts, accountNames)) {
                    this._sourceAccounts.forEach(a => {
                        let posting = tr.postings.find(p => p.account == a);
                        if (posting) {
                            let index;
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
                            let amount = posting.currency.amount || 0;
                            if (this._type == TransactionType.BOTH ||
                                (amount < 0 && this._type == TransactionType.DEBT) ||
                                (amount > 0 && this._type == TransactionType.CREDIT)) {
                                let stats = period.stats;
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
//# sourceMappingURL=app.js.map