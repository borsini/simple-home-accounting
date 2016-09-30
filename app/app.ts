///<reference path="../typings/index.d.ts" />

class Period {
        private _startDate: moment.Moment;
        private _endDate: moment.Moment;
        private _stats: any;

        constructor(startDate: moment.Moment, endDate: moment.Moment) {
            this._startDate = startDate; //Start date is inclusive
            this._endDate = endDate; //End date is exclusive
            this._stats = new Map<string, number>();
        }
        get startDate(): moment.Moment { return this._startDate; }
        get endDate(): moment.Moment { return this._endDate; }
        get stats(): Map<string, number> { return this._stats; }

        getName() {
            return this._startDate.format("DD/MM/YYYY") + " - " + this._endDate.format("DD/MM/YYYY");
        }
    }

    interface Transaction {
        header: Header;
        postings: Array<Posting>;
    }

    interface Header {
        date: string;
        title: string;
    }

    interface Posting {
        account: string;
        currency: Currency;
        comment: string;
    }

    interface Currency {
        amount: number;
        name: string;
    }

    interface Account {
        name: string;
        balance: number;
    }

    enum GroupBy { Account = 1, Year, Semester, Trimester, Month, Week, Day }
    enum StatParam { Sum = 1, Average }
    enum PeriodGap { None = 1, Year, Month, Week, Day }
    enum TransactionType { DEBT = 1, CREDIT, BOTH }
