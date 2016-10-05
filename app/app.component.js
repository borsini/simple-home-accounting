/// <reference path="app.ts"/>
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
const ledgerservice_1 = require('./ledgerservice');
let NumberToArray = class NumberToArray {
    transform(value, args) {
        let res = [];
        for (let i = 1; i <= value; i++) {
            res.push(i);
        }
        return res;
    }
};
NumberToArray = __decorate([
    core_1.Pipe({ name: 'numberToArray' }), 
    __metadata('design:paramtypes', [])
], NumberToArray);
exports.NumberToArray = NumberToArray;
let AppComponent = class AppComponent {
    constructor(ledger) {
        this.accounts = [];
        this.transactions = [];
        this.sliceStart = 0;
        this.sliceEnd = 5;
        this.nbPage = 0;
        this.currentPage = 0;
        this.perPage = 100;
        this.ledger = ledger;
    }
    startDateChanged(event) {
        this.startDate = moment(event.target.value, "YYYY-MM-DD");
        this.refreshTransactions();
    }
    endDateChanged(event) {
        this.endDate = moment(event.target.value, "YYYY-MM-DD");
        this.refreshTransactions();
    }
    onChange(event) {
        var files = event.srcElement.files;
        console.log(files);
        this.filename = files[0].name;
        this.ledger.openFile(files[0], () => {
            this.accounts = this.ledger.allAccounts;
            this.refreshTransactions();
        });
    }
    onAccountChanged(account) {
        this.selectedAccount = account;
        this.refreshTransactions();
    }
    onPageChanged(page) {
        this.currentPage = page;
        this.refreshSlices();
    }
    refreshTransactions() {
        var t0 = performance.now();
        this.transactions = this.ledger.filterTransactions(this.selectedAccount, this.startDate, this.endDate);
        var t1 = performance.now();
        console.log("Call to getTransactions took " + (t1 - t0) + " milliseconds.");
        this.currentPage = 1;
        this.nbPage = Math.ceil(this.transactions.length / this.perPage);
        this.refreshSlices();
    }
    refreshSlices() {
        this.sliceStart = (this.currentPage - 1) * this.perPage;
        this.sliceEnd = this.sliceStart + this.perPage;
    }
};
AppComponent = __decorate([
    core_1.Component({
        selector: 'my-app',
        templateUrl: './templates/app.html'
    }), 
    __metadata('design:paramtypes', [ledgerservice_1.LedgerService])
], AppComponent);
exports.AppComponent = AppComponent;
//# sourceMappingURL=app.component.js.map