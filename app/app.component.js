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
let HeaderComponent = class HeaderComponent {
    constructor(ledger) {
        this.ledger = ledger;
    }
    onChange(event) {
        var files = event.srcElement.files;
        console.log(files);
        this.filename = files[0].name;
        this.ledger.openFile(files[0], tr => {
            console.log(tr);
        });
    }
};
HeaderComponent = __decorate([
    core_1.Component({
        selector: 'app-header',
        templateUrl: './templates/header.html'
    }), 
    __metadata('design:paramtypes', [ledgerservice_1.LedgerService])
], HeaderComponent);
exports.HeaderComponent = HeaderComponent;
let ContentComponent = class ContentComponent {
    constructor(ledger) {
        this.transactions = [];
        this.transactions = ledger.transactions;
    }
};
ContentComponent = __decorate([
    core_1.Component({
        selector: 'app-content',
        templateUrl: './templates/content.html'
    }), 
    __metadata('design:paramtypes', [ledgerservice_1.LedgerService])
], ContentComponent);
exports.ContentComponent = ContentComponent;
let MenuComponent = class MenuComponent {
    constructor(ledger) {
        this.accounts = [];
        this.accounts = ledger.accounts;
    }
};
MenuComponent = __decorate([
    core_1.Component({
        selector: 'app-menu',
        templateUrl: './templates/menu.html',
        providers: [ledgerservice_1.LedgerService]
    }), 
    __metadata('design:paramtypes', [ledgerservice_1.LedgerService])
], MenuComponent);
exports.MenuComponent = MenuComponent;
let AppComponent = class AppComponent {
};
AppComponent = __decorate([
    core_1.Component({
        selector: 'my-app',
        templateUrl: './templates/app.html'
    }), 
    __metadata('design:paramtypes', [])
], AppComponent);
exports.AppComponent = AppComponent;
//# sourceMappingURL=app.component.js.map