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
const LEDGER_DATE_FORMAT = "DD/MM/YYYY";
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
    }
    // Changes XML to JSON
    xmlToJson(xml) {
        // Create the return object
        var obj = {};
        if (xml.nodeType == 1) {
            // do attributes
            if (xml.attributes.length > 0) {
                obj["@attributes"] = {};
                for (var j = 0; j < xml.attributes.length; j++) {
                    var attribute = xml.attributes.item(j);
                    obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
                }
            }
        }
        else if (xml.nodeType == 3) {
            obj = xml.nodeValue;
        }
        // do children
        if (xml.hasChildNodes()) {
            for (var i = 0; i < xml.childNodes.length; i++) {
                var item = xml.childNodes.item(i);
                var nodeName = item.nodeName;
                if (typeof (obj[nodeName]) == "undefined") {
                    obj[nodeName] = this.xmlToJson(item);
                }
                else {
                    if (typeof (obj[nodeName].push) == "undefined") {
                        var old = obj[nodeName];
                        obj[nodeName] = [];
                        obj[nodeName].push(old);
                    }
                    obj[nodeName].push(this.xmlToJson(item));
                }
            }
        }
        return obj;
    }
    ;
    openOfxFile(name, callback) {
        var reader = new FileReader();
        let me = this;
        reader.addEventListener('load', function () {
            let xmlOfx = reader.result
                .replace(/>\s+</g, '><')
                .replace(/\s+</g, '<')
                .replace(/>\s+/g, '>')
                .replace(/<([A-Z0-9_]*)+\.+([A-Z0-9_]*)>([^<]+)(<\/\1\.\2>)?/g, '<\$1\$2>\$3')
                .replace(/<(\w+?)>([^<]+)/g, '<\$1>\$2</<added>\$1>')
                .replace(/<\/<added>(\w+?)>(<\/\1>)?/g, '</\$1>');
            //console.log(xmlOfx);
            let jsOfx = me.xmlToJson(new DOMParser().parseFromString(xmlOfx, "text/xml"));
            console.log(jsOfx);
            jsOfx.OFX.BANKMSGSRSV1.STMTTRNRS.forEach(trList => {
                let c = trList.STMTRS.CURDEF['#text'];
                let acc = trList.STMTRS.BANKACCTFROM.ACCTID['#text'];
                trList.STMTRS.BANKTRANLIST.STMTTRN.forEach(tr => {
                    let d = moment(tr.DTPOSTED['#text'], "YYYYMMDD");
                    let a = tr.TRNAMT['#text'];
                    let n = tr.NAME['#text'];
                    let m = tr.MEMO['#text'];
                    let t = {
                        header: {
                            date: d.format(LEDGER_DATE_FORMAT),
                            title: n
                        },
                        postings: [
                            {
                                account: acc,
                                currency: {
                                    amount: parseFloat(a),
                                    name: c
                                },
                                comment: m
                            },
                            {
                                account: "Inconnu",
                                currency: {
                                    amount: null,
                                    name: null
                                },
                                comment: null
                            }
                        ]
                    };
                    me._transactions.push(t);
                });
            });
            me.addMissingAmount();
            me.computeStats();
            callback();
        });
        reader.readAsText(name);
    }
    openLedgerFile(name, callback) {
        var reader = new FileReader();
        let me = this;
        reader.addEventListener('load', function () {
            me._transactions.push.apply(me._transactions, PARSER.parse(reader.result));
            me._transactions.sort((tr1, tr2) => {
                let d1 = me.getTransactionDate(tr1);
                let d2 = me.getTransactionDate(tr2);
                if (d2 > d1)
                    return 1;
                else if (d2 < d1)
                    return -1;
                else
                    return 0;
            });
            me.addMissingAmount();
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
    getTransactionDate(tr) {
        return moment(tr.header.date, "YYYY/MM/DD");
    }
    computeStats() {
        let accountsAndBalance = new Map();
        this._transactions.forEach(tr => {
            let transactionDate = this.getTransactionDate(tr);
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
            "entre le " + this._minDate.format(LEDGER_DATE_FORMAT) + " et " + this._maxDate.format(LEDGER_DATE_FORMAT),
        ];
    }
    get transactions() {
        return this._transactions;
    }
    get allAccounts() {
        return this._allAccounts;
    }
    filterTransactions(account, startDate, endDate, tag) {
        return this._transactions.filter(tr => {
            let isValid = true;
            let trDate = this.getTransactionDate(tr);
            if (startDate) {
                isValid = isValid && trDate.isSameOrAfter(startDate);
            }
            if (endDate) {
                isValid = isValid && trDate.isSameOrBefore(endDate);
            }
            if (account) {
                isValid = isValid && (tr.postings.find(p => p.account == account) != null);
            }
            if (tag && tag.length > 0) {
                isValid = isValid && tr.header.tag == tag;
            }
            return isValid;
        });
    }
    addMissingAmount() {
        this._transactions.forEach(tr => {
            let totalSum = 0;
            let incompletePosting;
            let lastCurrency;
            tr.postings.forEach(ps => {
                if (ps.currency.amount) {
                    totalSum += ps.currency.amount;
                    lastCurrency = ps.currency.name;
                }
                else {
                    incompletePosting = ps;
                }
            });
            if (incompletePosting) {
                incompletePosting.currency.amount = -totalSum;
                incompletePosting.currency.name = lastCurrency;
            }
        });
    }
    analyzeTransactions(sourceAccount, toAccount, startDate, endDate, groupy, statParam, periodGap, numPeriods, transactionType, maxDepth) {
        this._sourceAccount = sourceAccount;
        this._toAccount = toAccount;
        this._periods = this.createPeriods(moment(startDate, LEDGER_DATE_FORMAT), moment(endDate, LEDGER_DATE_FORMAT), periodGap, numPeriods);
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
            let transactionDate = this.getTransactionDate(tr);
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