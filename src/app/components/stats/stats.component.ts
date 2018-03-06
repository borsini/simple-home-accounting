import { Component, OnInit } from '@angular/core';
import { NgRedux } from '@angular-redux/store';
import { UndoRedoState, presentSelector } from '../../shared/reducers/undo-redo-reducer';
import { AppState, DebitCreditRepartition, DebitCreditLine } from '../../shared/models/app-state';
import { filtersSelector, statsRepartitionSelector, AppStateActions, maxLevelSelector } from '../../shared/reducers/app-state-reducer';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css'],
})
export class StatsComponent implements OnInit {

  repartition: Observable<DebitCreditLine[]>;
  maxLevel: Observable<number>;

  constructor(private ngRedux: NgRedux<UndoRedoState<AppState>>) { }

  ngOnInit() {
    const filters = this.ngRedux.select(presentSelector(filtersSelector));

    filters.map(f => f.showOnlyInvalid);

    this.repartition = this.ngRedux.select(presentSelector(statsRepartitionSelector))
    .map(repartition => Object.values(repartition));

    this.maxLevel = this.ngRedux.select(presentSelector(maxLevelSelector)).do(console.log);
  }

  onStatsChecked(checked: boolean) {
    this.ngRedux.dispatch(AppStateActions.activateStats(checked));
  }

  sliderChanged(value) {
    this.ngRedux.dispatch(AppStateActions.setStatsLevel(value));
  }

}
