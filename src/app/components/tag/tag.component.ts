import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-tag',
  templateUrl: './tag.component.html',
  styleUrls: ['./tag.component.css']
})
export class TagComponent implements OnInit {

  @Input() name: string
  @Input() showDeleteButton: boolean
  @Output() onClosedClick = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

  deleteTagClicked() {
    this.onClosedClick.emit()
  }

}
