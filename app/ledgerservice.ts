import { Injectable } from '@angular/core';
import * as moment from "moment";
declare var PARSER:any; //PEG parser inclusion

const LEDGER_DATE_FORMAT = "DD/MM/YYYY"

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
    private _allAccountsByName: Map<String, Account>;

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
    }

    // Changes XML to JSON
    xmlToJson(xml) : any {
        // Create the return object
        var obj = {};

        if (xml.nodeType == 1) { // element
            // do attributes
            if (xml.attributes.length > 0) {
            obj["@attributes"] = {};
                for (var j = 0; j < xml.attributes.length; j++) {
                    var attribute = xml.attributes.item(j);
                    obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
                }
            }
        } else if (xml.nodeType == 3) { // text
            obj = xml.nodeValue;
        }

        // do children
        if (xml.hasChildNodes()) {
            for(var i = 0; i < xml.childNodes.length; i++) {
                var item = xml.childNodes.item(i);
                var nodeName = item.nodeName;
                if (typeof(obj[nodeName]) == "undefined") {
                    obj[nodeName] = this.xmlToJson(item);
                } else {
                    if (typeof(obj[nodeName].push) == "undefined") {
                        var old = obj[nodeName];
                        obj[nodeName] = [];
                        obj[nodeName].push(old);
                    }
                    obj[nodeName].push(this.xmlToJson(item));
                }
            }
        }
        return obj;
    };

    openOfxFile(name: Blob, callback: () => any){
        var reader = new FileReader();
        
        let me = this;
        reader.addEventListener('load', function () {
            let xmlOfx = reader.result
                        // Remove empty spaces and line breaks between tags
                        .replace(/>\s+</g, '><')
                        // Remove empty spaces and line breaks before tags content
                        .replace(/\s+</g, '<')
                        // Remove empty spaces and line breaks after tags content
                        .replace(/>\s+/g, '>')
                        // Remove dots in start-tags names and remove end-tags with dots
                        .replace(/<([A-Z0-9_]*)+\.+([A-Z0-9_]*)>([^<]+)(<\/\1\.\2>)?/g, '<\$1\$2>\$3' )
                        // Add a new end-tags for the ofx elements
                        .replace(/<(\w+?)>([^<]+)/g, '<\$1>\$2</<added>\$1>')
                        // Remove duplicate end-tags
                        .replace(/<\/<added>(\w+?)>(<\/\1>)?/g, '</\$1>');
 
            //console.log(xmlOfx);
            let jsOfx = me.xmlToJson(new DOMParser().parseFromString(xmlOfx, "text/xml"));
            console.log(jsOfx);

            jsOfx.OFX.BANKMSGSRSV1.STMTTRNRS.forEach(trList => {

                let c = trList.STMTRS.CURDEF['#text']
                let acc = trList.STMTRS.BANKACCTFROM.ACCTID['#text']

                trList.STMTRS.BANKTRANLIST.STMTTRN.forEach(tr => {

                    let d = moment(tr.DTPOSTED['#text'], "YYYYMMDD")
                    let a = tr.TRNAMT['#text']
                    let n = tr.NAME['#text']
                    let m = tr.MEMO['#text']

                    let t: Transaction = {
                        header: {
                            tag: null,
                            date: d.format(LEDGER_DATE_FORMAT),
                            title: n
                        },
                        postings: [
                            {
                                tag: null,
                                account: acc,
                                amount: parseFloat(a),
                                currency: c,
                                comment: m
                            },
                            {
                                tag: null,
                                account: "Inconnu",
                                amount: null,
                                currency: null,
                                comment: null
                            }
                        ]
                    }
                    me._transactions.push(t)
                })
            })
            me.addMissingAmount();
            me.computeStats();
            callback();
        });

        reader.readAsText(name);
    }

    openLedgerFile(name: Blob, callback: () => any){
        var reader = new FileReader();

        let me = this;
        reader.addEventListener('load', function () {
            me._transactions.push.apply(me._transactions, PARSER.parse(reader.result));
            me._transactions.sort( (tr1: Transaction, tr2: Transaction) => {
                let d1 = me.getTransactionDate(tr1);
                    let d2 = me.getTransactionDate(tr2);
                    if (d2 > d1) return 1;
                    else if (d2 < d1) return -1;
                    else return 0;
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

    private getTransactionDate(tr: Transaction) : moment.Moment {
        return moment(tr.header.date, "YYYY/MM/DD");
    }

    computeStats() {
        this._allAccountsByName = new Map();
        //let accountsAndBalance = new Map<string, number>();
        
        this._transactions.forEach(tr => {

            let transactionDate = this.getTransactionDate(tr);

            this._minDate =  this._minDate ? moment.min( this._minDate, transactionDate) : transactionDate;
                this._maxDate =  this._maxDate ? moment.max( this._maxDate, transactionDate) : transactionDate;

            tr.postings.forEach(ps => {
                if(ps.currency){
                    this._currencies.add(ps.currency);
                }

                let accountParts = ps.account.split(":");
                let lastParent: Account;
                let currentAccountName: string = "";
                for (let part of accountParts) {
                    currentAccountName += part;
                    let account = this.getOrCreateAccount(currentAccountName);
                    this.addAmountToAccount(account, ps.amount, currentAccountName == ps.account);
                    
                    if(lastParent){
                        lastParent.children.add(account);
                    }

                    lastParent = account;
                    currentAccountName += ":";
                }
            });
        });
    }

    private getOrCreateAccount(name : string) : Account {
        let stat = this._allAccountsByName.get(name);
        
        if(!stat){
            stat = new Account(name);
            this._allAccountsByName.set(name, stat);
        }

        return stat;           
    }

    private addAmountToAccount(a: Account, amount: number, isFinalAccount: boolean) {
        if(!isFinalAccount){
            a.childrenBalance += amount;
        }
        else{
            a.balance += amount;
        }
        a.nbTransactions++
    }

    get transactions():Array<Transaction> {
        return this._transactions;
    }

    get topAccounts(): Array<Account> {
        return Array.from(this._allAccountsByName.values()).filter( a => a.name.indexOf(':') == -1).sort( (a1, a2) => a1.name.localeCompare(a2.name) )
    }

    filterTransactions(account: string, startDate: moment.Moment, endDate: moment.Moment, tag: string){
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

            if(tag && tag.length > 0){
                isValid = isValid && tr.header.tag == tag;
            }

            return isValid;
        });
    }

    addMissingAmount() {
        this._transactions.forEach(tr => {

            let totalSum: number = 0;
            let incompletePosting : Posting;
            let lastCurrency : string;

            tr.postings.forEach(ps => {
                if (ps.amount) {
                    totalSum += ps.amount;
                    lastCurrency = ps.currency;
                }
                else {
                    incompletePosting = ps;
                }
            });

            if (incompletePosting) {
                incompletePosting.amount = - totalSum;
                incompletePosting.currency = lastCurrency;
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
        this._periods = this.createPeriods(moment(startDate, LEDGER_DATE_FORMAT), moment(endDate, LEDGER_DATE_FORMAT), periodGap, numPeriods);
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
                out += p.account + "    " + p.currency + " " + p.amount;
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

                                let amount: number = posting.amount || 0;

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