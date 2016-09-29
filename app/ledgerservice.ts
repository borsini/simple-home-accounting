import { Injectable } from '@angular/core';
import from 'app/parser_ledger.js';

@Injectable()
export class LedgerService {

    accounts: string[] = [];
    transactions: Transaction[] = [];

    openFile(name: string, callback: (tr: Transaction[]) => any){
        var reader = new FileReader();

                reader.addEventListener('load', function () {
                    transactions.push.apply(transactions, PARSER.parse(reader.result));
                    engine = new Engine(transactions);

                    callback(transactions);
                });

        reader.readAsText(name);
    }

/*
    getTransactions() : Array<Transaction> {
        return [
            {
            header : {
                date : "10/12/1986",
                title : "Essence"
            },
            postings : [
                {
                account : "Dépenses:Voiture",
                comment : "",
                currency : {
                    amount : 45,
                    name: "EUR"
                }
                },
                {
                account : "Actif:Compte courant",
                comment : "Commentaire",
                currency : {
                    amount : -45,
                    name: "EUR"
                }
                }
            ]
            },
            {
            header : {
                date : "11/12/1986",
                title : "Pain"
            },
            postings : [
                {
                account : "Dépenses:Quotidien",
                comment : "",
                currency : {
                    amount : 1.50,
                    name: "EUR"
                }
                },
                {
                account : "Actif:Compte courant",
                comment : "Commentaire",
                currency : {
                    amount : -1.50,
                    name: "EUR"
                }
                }
            ]
            }
        ];
    }*/
}