import { Component, OnInit, Input, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatButton, MatInput } from '../../../../node_modules/@angular/material';

@Component({
  selector: 'app-tags',
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.css']
})
export class TagsComponent implements OnInit {

  @Input() tags: string[]
  @Input() allowEditing: boolean
  @Output() onClosedClick = new EventEmitter<string>();
  @Output() onTagAdded = new EventEmitter<string>();
  @ViewChild(MatInput) newTag: MatInput;

  constructor() { }

  ngOnInit() {
  }

  onTagClosedClick(tag: string) {
    this.onClosedClick.emit(tag)
  }

  onEnterPressed(name: string) {
    this.onTagAdded.emit(name)
    this.newTag.value = "";
  }
}
