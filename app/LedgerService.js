"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
const core_1 = require('@angular/core');
'./parser_ledger.js';
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
let LedgerService = class LedgerService {
    constructor() {
        this._transactions = [];
        this._grouping = GroupBy.Account;
        this._param = StatParam.Sum;
        this._visu = new GoogleChartsVisu();
        this._periods = [];
        this._transactions = [];
        this._currencies = new Set();
        this.addMissingAmount();
    }
    openFile(name, callback) {
        var reader = new FileReader();
        let me = this;
        reader.addEventListener('load', function () {
            me._transactions = PARSER.parse(reader.result);
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
    computeStats() {
        let accountsAndBalance = new Map();
        this._transactions.forEach(tr => {
            let transactionDate = moment(tr.header.date, "YYYY/MM/DD");
            this._minDate = this._minDate ? moment.min(this._minDate, transactionDate) : transactionDate;
            this._maxDate = this._maxDate ? moment.max(this._maxDate, transactionDate) : transactionDate;
            tr.postings.forEach(ps => {
                if (ps.currency.name) {
                    this._currencies.add(ps.currency.name);
                }
                let accountsToAddAmount = [];
                if (ps.account.indexOf(":") > 0) {
                    let sum = "";
                    for (let entry of ps.account.split(":")) {
                        sum += entry;
                        accountsToAddAmount.push(sum);
                        sum += ":";
                    }
                }
                else {
                    accountsToAddAmount.push(ps.account);
                }
                accountsToAddAmount.forEach(a => {
                    let lastAmount = accountsAndBalance.get(a) || 0;
                    accountsAndBalance.set(a, lastAmount + ps.currency.amount);
                });
            });
        });
        this._allAccounts = Array.from(accountsAndBalance).map(e => {
            return {
                name: e[0],
                balance: e[1]
            };
        }).sort((a1, a2) => a1.name.localeCompare(a2.name));
    }
    get stats() {
        return [
            this._transactions.length + " transactions sur " + this._allAccounts.length + " comptes " + " avec " + this._currencies.size + " monnaies",
            "entre le " + this._minDate.format("DD/MM/YYYY") + " et " + this._maxDate.format("DD/MM/YYYY"),
        ];
    }
    get transactions() {
        return this._transactions;
    }
    get allAccounts() {
        return this._allAccounts;
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
    getOutString() {
        let out = "";
        this._transactions.forEach(tr => {
            out += tr.header.date + " " + tr.header.title + "\n";
            tr.postings.forEach(p => {
                out += "    ";
                out += p.account + "    " + p.currency.name + " " + p.currency.amount;
                out += p.comment ? " ; " + p.comment : "";
                out += "\n";
            });
            out += "\n";
        });
        return out;
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
};
LedgerService = __decorate([
    core_1.Injectable(), 
    __metadata('design:paramtypes', [])
], LedgerService);
exports.LedgerService = LedgerService;
//# sourceMappingURL=ledgerservice.js.map