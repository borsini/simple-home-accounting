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
let AppComponent = class AppComponent {
    constructor(ledger) {
        this.accounts = [];
        this.transactions = [];
        this.ledger = ledger;
    }
    onChange(event) {
        var files = event.srcElement.files;
        console.log(files);
        this.filename = files[0].name;
        this.ledger.openFile(files[0], () => {
            this.accounts = this.ledger.allAccounts;
            this.transactions = this.ledger.transactions;
        });
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