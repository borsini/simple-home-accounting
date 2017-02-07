/// <reference path="app.ts"/>

import { Pipe, PipeTransform, Component, Input, Output, EventEmitter } from '@angular/core';
import { LedgerService, StatsParam }        from './ledgerservice';
import * as saveAs from 'file-saver';
import * as moment from "moment";

@Pipe({name: 'numberToArray'})
export class NumberToArray implements PipeTransform {
  transform(value, args:string[]) : any {
    let res : number[] = [];
    for (let i = 1; i <= value; i++) {
        res.push(i);
      }
      return res;
  }
}

@Pipe({name: 'keys'})
export class KeysPipe implements PipeTransform {
  transform(value, args:string[]) : any {
    let keys = [];
    for (var enumMember in value) {
      var isValueProperty = parseInt(enumMember, 10) >= 0
      if (isValueProperty) {
        keys.push({key: enumMember, value: value[enumMember]});
        // Uncomment if you want log
        // console.log("enum member: ", value[enumMember]);
      } 
    }
    return keys;
  }
}

@Component({
  selector: 'my-app',
  templateUrl: './templates/app.html'
})
export class AppComponent { 
  filename : string
  filename2 : string
  ledger: LedgerService
  rootAccount : Account;
  transactions : Transaction[] = []
  selectedAccounts: Account[] = []
  startDate: moment.Moment
  endDate: moment.Moment
  tagFilter = ""
  transactionToAdd : Transaction;
  behavior: SelectionBehavior = SelectionBehavior.UNION;

  sliceStart: number = 0;
  sliceEnd: number = 5;
  
  nbPage: number = 0;
  currentPage: number = 0;
  perPage: number = 100;
  types = TransactionType;
  currentType = TransactionType.BOTH;

  //Stats
  maxDepth: number = 1;
  currentDepth = 1;
  params = StatParam
  currentParam = StatParam.Sum
  
  chart: any;

  constructor(ledger: LedgerService) {
    this.ledger = ledger;
    this.rootAccount = new Account("Tous");
    this.startDate = moment().subtract(2, 'years')
    this.endDate = moment()
    this.transactionToAdd = {
      header : {
        date: moment().format("YYYY/MM/DD"),
        tag: null,
        title: null
      },
      postings : [
        {
          account: null,
          amount: 0,
          comment: null,
          currency: null,
          tag: null
        }
      ]
    }
  }

  startDateChanged(event){ 
    this.startDate = moment(event.target.value, "YYYY-MM-DD");
    this.refreshTransactions();
  }

  endDateChanged(event){
    this.endDate = moment(event.target.value, "YYYY-MM-DD");
    this.refreshTransactions(); 
  }

  uploadLedgerOnChange(files: FileList) {
    this.ledger.openLedgerFile(files.item(0), 
      () => {
        this.rootAccount.children = new Set(this.ledger.topAccounts);
        this.refreshTransactions();
      });
  }

  uploadOfxOnChange(files: FileList) {
    this.ledger.openOfxFile(files.item(0), 
      () => {
        console.log('ofx loaded');
        this.rootAccount.children = new Set(this.ledger.topAccounts);
        this.refreshTransactions();
      });
  }

  onAccountClicked(account: Account){
    let index = this.selectedAccounts.indexOf(account);

    if(index == -1){
      this.selectedAccounts.push(account)
    }
    else{
      this.selectedAccounts.splice(index, 1)
    }
    
    this.refreshTransactions();
  }

  nbTransactionsInSelectedAccounts(): number {
    return this.selectedAccounts.map( a => a.nbTransactions).reduce( (l, r) => l + r, 0)
  }

  onPageChanged(page: number){
    this.currentPage = page;
    this.refreshSlices();
  }

  onStatusChanged(e: Event){
    this.tagFilter = e.target.selectedOptions[0].value
    this.refreshTransactions()
  }

  onDepthChanged(depth: number){
    this.currentDepth = depth
    this.refreshStats()
  }

  onTypeChanged(type: string){
    this.currentType = Number(type)
    this.refreshTransactions()
    this.refreshStats()
  }

  onParamChanged(type: string){
    this.currentParam = Number(type)
    this.refreshStats()
  }

  onSaveClicked() {
    var blob = new Blob([this.ledger.getOutString()], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "accounts.ledger");
  }

  refreshTransactions(){
    var t0 = performance.now();
    this.transactions = this.ledger.filterTransactions(this.behavior, this.selectedAccounts, this.startDate, this.endDate, this.tagFilter, TransactionType.BOTH);
    var t1 = performance.now();
    console.log("Call to filterTransactions took " + (t1 - t0) + " milliseconds.");

    this.currentPage = 1;
    this.nbPage = Math.ceil(this.transactions.length / this.perPage);
    this.refreshSlices();
    var t2 = performance.now()
    this.refreshStats();
    var t3 = performance.now()
    console.log("Call to refreshStats took " + (t3 - t2) + " milliseconds.");
    
    this.transactions.forEach(t => {
      t.postings.forEach(p => {
        if(!p.account || "Inconnu" == p.account){
          console.log("categorizing posting for transaction " + t.header.title)
          this.ledger.categorize(p, t)
        }
      })
    })
  }

  refreshStats(){
    let maxDepth = 1;
    this.ledger.flatAccounts.forEach( a => {
      maxDepth = Math.max(a.name.split(':').length, maxDepth)
    })

    this.maxDepth = maxDepth

    this.showStats()
  }

  showStats(){
    let params : StatsParam = {
      from: this.selectedAccounts,
      startDate: this.startDate,
      endDate: this.endDate,
      groupy: GroupBy.Account,
      maxDepth: this.currentDepth,
      numPeriods: 1,
      periodGap: PeriodGap.None,
      transactionType: this.currentType,
      statParam: this.currentParam
    }

    let periods = this.ledger.analyzeTransactions(this.transactions, params)

    if(this.chart){
      this.chart.destroy()
    }
    let data = this.periodToPieData(periods[0])
    this.chart = this.createPieChartWithData(data)
  }

  createPieChartWithData(data: ChartJsData){
      return new Chart(document.getElementById("chart"), {
        type: "pie",
        data: data,
        options: {
          cutoutPercentage: 50
        }
    })
  }

  hashCode(str) { // java String#hashCode
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  } 

  intToRGB(i){
    var c = (i & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();

    return "00000".substring(0, 6 - c.length) + c;
  }

  periodToPieData(period: Period) : ChartJsData {
    var indexes = new Set<string>();
    
    period.stats.forEach( (k, v) => {
      indexes.add(v);
    })

    let labels = Array.from(indexes.values())
    let dataset = {
          data: labels.map( l => Math.abs(period.stats.get(l)).toFixed(2)),
          borderWidth: 1,
          backgroundColor: labels.map( l => '#' + this.intToRGB(this.hashCode(l)))
        }

    let data = {
        labels: labels,
        datasets: [dataset]
    }

    return data;
  }

  drawPeriodsAsBar(periods: Array<Period>) {

    var indexes = new Set<string>();
    periods.forEach(p => {
      p.stats.forEach( (k, v) => {
        indexes.add(v);
      })
    });
                
    var ctx = document.getElementById("myChart");

    let labels = Array.from(indexes.values())
    let datasets : any[] = [];

    labels.forEach((label, index) => {
      datasets.push(
        {
          label: label,
          data: periods.map( p => p.stats.get(label)),
          borderWidth: 1,
          backgroundColor: '#' + this.intToRGB(this.hashCode(label)),
        }
      )
    })

    let data = {
        labels: periods.map(p => p.getName()),
        datasets: datasets
    }

    if(this.chart){
      this.chart.destroy(
      )
    }

    this.chart = new Chart(ctx, {
        type: "bar",
        data: data,
        options: {
            scales: {
                xAxes: [{
                    stacked: true
                }],
                yAxes: [{
                    stacked: true
                }]
            }
        }
    });
  }

  refreshSlices(){
    this.sliceStart = (this.currentPage - 1) * this.perPage;
    this.sliceEnd = this.sliceStart + this.perPage;
  }
}

@Component({
  selector: '[transaction-header]',
  templateUrl: './templates/transaction_header.html'
})
export class TransactionHeaderComponent {
  @Input()
  header: Header;

  isEditing = false;

  onEditClicked() {
    this.isEditing = !this.isEditing;
  }
}

@Component({
  selector: '[transaction-body]',
  templateUrl: './templates/transaction_body.html'
})
export class TransactionBodyComponent {
  @Input()
  posting: Posting;

  @Input()
  isEditing = false;

  @Input()
  isLastPosting: boolean;
}

@Component({
  selector: 'account-tree',
  templateUrl: './templates/account_tree.html'
})
export class AccountTreeComponent {
  @Input()
  account: Account;

  @Input()
  selectedAccounts: Account[];

  isCollapsed: boolean = false;
  
  @Input()
  isChecked: boolean;

  @Output()
  accountSelected = new EventEmitter<Account>();

  onAccountSelected(){
    this.accountSelected.emit(this.account);
  }

  onAccountChecked(chk : boolean){
    this.isChecked = chk
  }

  onChildSelected(account: Account){
    this.accountSelected.emit(account);
  }

  toggle(){
    this.isCollapsed = !this.isCollapsed;
  }
}