import { Observable } from 'rxjs';
import { Component, Input, OnInit } from '@angular/core';
import { TreeDatasource, TreeItem, TreeDelegate } from './models';

@Component({
  selector: 'app-tree',
  styleUrls: ['./tree.component.css'],
  templateUrl: './tree.component.html',
})
export class TreeComponent implements OnInit {

  item: Observable<TreeItem | undefined>;
  
  @Input()
  itemId: string;

  @Input()
  datasource: TreeDatasource;

  @Input()
  delegate: TreeDelegate;

  @Input()
  showCheckbox: boolean = false;

  @Input()
  treeLevel: number = 0;

  isCollapsed = false;

  ngOnInit() {
    this.item = this.datasource.getItemForId(this.itemId);
  }

  handleOnClick(item: TreeItem) {
    this.delegate.onItemClicked(item);
  }

  handleCheck(item: TreeItem, isChecked: boolean) {
    this.delegate.onItemChecked(item, isChecked);
  }

  toggle() {
    this.isCollapsed = !this.isCollapsed;
  }

}

