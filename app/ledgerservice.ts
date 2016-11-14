import { Injectable } from '@angular/core';
import * as moment from "moment";

declare var PARSER:any; //PEG parser inclusion

const LEDGER_DATE_FORMAT = "DD/MM/YYYY"

export interface StatsParam {
    from: Account
    groupy: GroupBy
    statParam: StatParam
    periodGap: PeriodGap;
    numPeriods: number
    transactionType: TransactionType
    maxDepth: number
    startDate: moment.Moment
    endDate: moment.Moment
}

class Bayes {

    options: any;
    tokenizer: any;
    vocabulary: any;
    vocabularySize: number;
    totalDocuments: number;
    docCount: any;
    wordCount: any;
    wordFrequencyCount: any;
    categories: any;
    /**
     * Naive-Bayes Classifier
     *
     * This is a naive-bayes classifier that uses Laplace Smoothing.
     *
     * Takes an (optional) options object containing:
     *   - `tokenizer`  => custom tokenization function
     *
     */
    constructor(options?) {
    // set options object
    this.options = {}
    if (typeof options !== 'undefined') {
        if (!options || typeof options !== 'object' || Array.isArray(options)) {
        throw TypeError('NaiveBayes got invalid `options`: `' + options + '`. Pass in an object.')
        }
        this.options = options
    }

    this.tokenizer = this.options.tokenizer || this.defaultTokenizer

    //initialize our vocabulary and its size
    this.vocabulary = {}
    this.vocabularySize = 0

    //number of documents we have learned from
    this.totalDocuments = 0

    //document frequency table for each of our categories
    //=> for each category, how often were documents mapped to it
    this.docCount = {}

    //for each category, how many words total were mapped to it
    this.wordCount = {}

    //word frequency table for each category
    //=> for each category, how frequent was a given word mapped to it
    this.wordFrequencyCount = {}

    //hashmap of our category names
    this.categories = {}
    }

/**
 * train our naive-bayes classifier by telling it what `category`
 * the `text` corresponds to.
 *
 * @param  {String} text
 * @param  {String} class
 */
    learn (text: string, category: string) {

    //initialize category data structures if we've never seen this category
    this.initializeCategory(category)

    //update our count of how many documents mapped to this category
    this.docCount[category]++

    //update the total number of documents we have learned from
    this.totalDocuments++

    //normalize the text into a word array
    var tokens = this.tokenizer(text)

    //get a frequency count for each token in the text
    var frequencyTable = this.frequencyTable(tokens)

    /*
        Update our vocabulary and our word frequency count for this category
    */

    let self = this;
    Object
    .keys(frequencyTable)
    .forEach(function (token) {
        //add this word to our vocabulary if not already existing
        if (!self.vocabulary[token]) {
        self.vocabulary[token] = true
        self.vocabularySize++
        }

        var frequencyInText = frequencyTable[token]

        //update the frequency information for this word in this category
        if (!self.wordFrequencyCount[category][token])
        self.wordFrequencyCount[category][token] = frequencyInText
        else
        self.wordFrequencyCount[category][token] += frequencyInText

        //update the count of all words we have seen mapped to this category
        self.wordCount[category] += frequencyInText
    })
}

/**
 * Initialize each of our data structure entries for this new category
 *
 * @param  {String} categoryName
 */
initializeCategory (categoryName: string) {
  if (!this.categories[categoryName]) {
    this.docCount[categoryName] = 0
    this.wordCount[categoryName] = 0
    this.wordFrequencyCount[categoryName] = {}
    this.categories[categoryName] = true
  }
}

/**
 * Build a frequency hashmap where
 * - the keys are the entries in `tokens`
 * - the values are the frequency of each entry in `tokens`
 *
 * @param  {Array} tokens  Normalized word array
 * @return {Object}
 */
frequencyTable (tokens: string[]) {
  var frequencyTable = Object.create(null)

  tokens.forEach(function (token) {
    if (!frequencyTable[token])
      frequencyTable[token] = 1
    else
      frequencyTable[token]++
  })

  return frequencyTable
}

/**
 * Given an input string, tokenize it into an array of word tokens.
 * This is the default tokenization function used if user does not provide one in `options`.
 *
 * @param  {String} text
 * @return {Array}
 */
defaultTokenizer (text) : Array<any> {
  //remove punctuation from text - remove anything that isn't a word char or a space
  var rgxPunctuation = /[^(a-zA-ZA-Яa-я0-9_)+\s]/g

  var sanitized = text.replace(rgxPunctuation, ' ')

  return sanitized.split(/\s+/)
}

/**
 * Determine what category `text` belongs to.
 *
 * @param  {String} text
 * @return {String} category
 */
categorize (text: string) : string {
  var self = this
    , maxProbability = -Infinity
    , chosenCategory = null

  var tokens = self.tokenizer(text)
  var frequencyTable = self.frequencyTable(tokens)

  //iterate thru our categories to find the one with max probability for this text
  Object
  .keys(self.categories)
  .forEach(function (category) {

    //start by calculating the overall probability of this category
    //=>  out of all documents we've ever looked at, how many were
    //    mapped to this category
    var categoryProbability = self.docCount[category] / self.totalDocuments

    //take the log to avoid underflow
    var logProbability = Math.log(categoryProbability)

    //now determine P( w | c ) for each word `w` in the text
    Object
    .keys(frequencyTable)
    .forEach(function (token) {
      var frequencyInText = frequencyTable[token]
      var tokenProbability = self.tokenProbability(token, category)

      // console.log('token: %s category: `%s` tokenProbability: %d', token, category, tokenProbability)

      //determine the log of the P( w | c ) for this word
      logProbability += frequencyInText * Math.log(tokenProbability)
    })

    if (logProbability > maxProbability) {
      maxProbability = logProbability
      chosenCategory = category
    }
  })

  return chosenCategory
}

/**
 * Calculate probability that a `token` belongs to a `category`
 *
 * @param  {String} token
 * @param  {String} category
 * @return {Number} probability
 */
tokenProbability (token: string, category: string) : number {
  //how many times this word has occurred in documents mapped to this category
  var wordFrequencyCount = this.wordFrequencyCount[category][token] || 0

  //what is the count of all words that have ever been mapped to this category
  var wordCount = this.wordCount[category]

  //use laplace Add-1 Smoothing equation
  return ( wordFrequencyCount + 1 ) / ( wordCount + this.vocabularySize )
}

toJson() : string{
    return JSON.stringify(
        [
             {"categories": this.categories},
             {"docCount": this.docCount},
             {"totalDocuments": this.totalDocuments},
             {"vocabulary": this.vocabulary},
             {"vocabularySize": this.vocabularySize},
             {"wordCount": this.wordCount},
             {"wordFrequencyCount": this.wordFrequencyCount}
        ]
    )
}

}

@Injectable()
export class LedgerService {

    private _debitClassifier = new Bayes();
    private _creditClassifier = new Bayes();

    private _transactions: Array<Transaction> = [];
    private _allAccountsByName: Map<String, Account>;
    
    private _minDate: moment.Moment;
    private _maxDate: moment.Moment;
    private _currencies: Set<string>;

    constructor() {
        this._transactions = [];
        this._currencies = new Set();
        this._allAccountsByName = new Map();
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
            me.learnBayes();
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
            me.learnBayes();
            callback();
        });

        reader.readAsText(name);
    }

    learnBayes(){
        this._transactions.forEach(t => {
            t.postings.forEach(p => {
                if(p.account && p.account != "Inconnu"){
                    let input = [t.header.title, p.comment].join(' ')
                    let classifier = p.amount > 0 ? this._creditClassifier : this._debitClassifier
                    classifier.learn(input, p.account)
                }
            })
        })
    }

    categorize(p: Posting, t: Transaction): Account{
        let input = [t.header.title, p.comment].join(' ')
        let classifier = p.amount > 0 ? this._creditClassifier : this._debitClassifier
        let account = classifier.categorize(input)
        console.log(account)
        return this._allAccountsByName.get(account)
    }

    createPeriods(params: StatsParam) {
        let from = params.startDate.clone();
        let periods = [];

        while (from < params.endDate) {
            let to;

            if (params.periodGap == PeriodGap.Year) {
                to = from.clone().add(params.numPeriods, 'year');
            }
            else if (params.periodGap == PeriodGap.Month) {
                to = from.clone().add(params.numPeriods, 'month');
            }
            else if (params.periodGap == PeriodGap.Week) {
                to = from.clone().add(params.numPeriods, 'week');
            }
            else if (params.periodGap == PeriodGap.Day) {
                to = from.clone().add(params.numPeriods, 'day');
            }
            else {
                to = params.endDate;
            }
            periods.push(new Period(from, moment.min(to, params.endDate)));

            from = to.clone();
        }

        return periods;
    }

    private getTransactionDate(tr: Transaction) : moment.Moment {
        return moment(tr.header.date, "YYYY/MM/DD");
    }

    computeStats() {
        this._allAccountsByName = new Map();
        
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

    get flatAccounts(): Account[] {
        return Array.from(this._allAccountsByName.values());
    }

    get topAccounts(): Account[] {
        return Array.from(this._allAccountsByName.values()).filter( a => a.name.indexOf(':') == -1).sort( (a1, a2) => a1.name.localeCompare(a2.name) )
    }

    filterTransactions(account: string, startDate: moment.Moment, endDate: moment.Moment, tag: string, type: TransactionType){
        return this._transactions.filter( tr => {
            let isValid: boolean = true;

            let trDate = this.getTransactionDate(tr);
            if(startDate){
                isValid = isValid && trDate.isSameOrAfter(startDate);
            }

            if(endDate){
                isValid = isValid && trDate.isSameOrBefore(endDate);
            }

            let postingMatchingAccountAndType = tr.postings.filter( p => p.account == account).find( p => 
                    type == TransactionType.BOTH ||
                    p.amount >= 0 && type == TransactionType.CREDIT ||
                    p.amount <= 0 && type == TransactionType.DEBT 
            )

            isValid = isValid && (postingMatchingAccountAndType != null);

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
        transactions: Transaction[],
        params: StatsParam) : Array<Period>{
       
        let periods = this.createPeriods(params);
        
        transactions.forEach(tr => this.analyzeTransaction(tr, periods, params));
        return periods;
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

    analyzeTransaction(
        tr: Transaction,
        periods: Period[],
        params: StatsParam) {

        periods.forEach(
            period => {
                let transactionDate: moment.Moment = this.getTransactionDate(tr);
                if (transactionDate >= period.startDate && transactionDate < period.endDate) {
                    let accountNames: Array<any> = tr.postings.map(p => p.account);
                    let posting =  tr.postings.find(function (p) {
                        return p.account.indexOf(params.from.name) >= 0;
                    });

                    if(posting){
                        for(let p of tr.postings){
                            if( p != posting){
                                let index: string;
                                if (params.groupy == GroupBy.Account) {
                                    index = p.account.split(":", params.maxDepth).join(":");
                                }
                                else if (params.groupy == GroupBy.Year) {
                                    index = String(transactionDate.year());
                                }
                                else if (params.groupy == GroupBy.Semester) {

                                    index = String(Math.floor(transactionDate.month() / 6));
                                }
                                else if (params.groupy == GroupBy.Trimester) {
                                    index = String(Math.floor(transactionDate.month() / 3));
                                }
                                else if (params.groupy == GroupBy.Month) {
                                    index = String(transactionDate.month());
                                }
                                else if (params.groupy == GroupBy.Week) {
                                    index = String(transactionDate.week());
                                }
                                else if (params.groupy == GroupBy.Day) {
                                    index = String(transactionDate.weekday());
                                }

                                let amount: number = posting.amount || 0;

                                if (params.transactionType == TransactionType.BOTH ||
                                    (amount < 0 && params.transactionType == TransactionType.DEBT) ||
                                    (amount > 0 && params.transactionType == TransactionType.CREDIT)) {
                                    
                                    let stats = period.stats;
                                    this.addStat(index, amount, period, params.statParam);
                                }
                            }
                        }
                    }
                }
            });
    }

    addStat(index: string, amount: number, period: Period, param: StatParam){
        let stats = period.stats;
        if (param == StatParam.Sum) {
            stats.set(index, (stats.get(index) || 0) + amount);
        }
        else if (param == StatParam.Average) {
            stats.set(index, stats.has(index) ? (stats.get(index) + amount) / 2 : amount);
        }
    }
}