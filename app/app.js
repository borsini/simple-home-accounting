///<reference path="../typings/index.d.ts" />
class Period {
    constructor(startDate, endDate) {
        this._startDate = startDate; //Start date is inclusive
        this._endDate = endDate; //End date is exclusive
        this._stats = new Map();
    }
    get startDate() { return this._startDate; }
    get endDate() { return this._endDate; }
    get stats() { return this._stats; }
    getName() {
        return this._startDate.format("DD/MM/YYYY") + " - " + this._endDate.format("DD/MM/YYYY");
    }
}
var GroupBy;
(function (GroupBy) {
    GroupBy[GroupBy["Account"] = 1] = "Account";
    GroupBy[GroupBy["Year"] = 2] = "Year";
    GroupBy[GroupBy["Semester"] = 3] = "Semester";
    GroupBy[GroupBy["Trimester"] = 4] = "Trimester";
    GroupBy[GroupBy["Month"] = 5] = "Month";
    GroupBy[GroupBy["Week"] = 6] = "Week";
    GroupBy[GroupBy["Day"] = 7] = "Day";
})(GroupBy || (GroupBy = {}));
var StatParam;
(function (StatParam) {
    StatParam[StatParam["Sum"] = 1] = "Sum";
    StatParam[StatParam["Average"] = 2] = "Average";
})(StatParam || (StatParam = {}));
var PeriodGap;
(function (PeriodGap) {
    PeriodGap[PeriodGap["None"] = 1] = "None";
    PeriodGap[PeriodGap["Year"] = 2] = "Year";
    PeriodGap[PeriodGap["Month"] = 3] = "Month";
    PeriodGap[PeriodGap["Week"] = 4] = "Week";
    PeriodGap[PeriodGap["Day"] = 5] = "Day";
})(PeriodGap || (PeriodGap = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType[TransactionType["DEBT"] = 1] = "DEBT";
    TransactionType[TransactionType["CREDIT"] = 2] = "CREDIT";
    TransactionType[TransactionType["BOTH"] = 3] = "BOTH";
})(TransactionType || (TransactionType = {}));
//# sourceMappingURL=app.js.map