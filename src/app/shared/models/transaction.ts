import { Posting } from './posting';
import * as moment from 'moment';

export interface Transaction {
  uuid?: string;
  header: Header;
  postings: Array<Posting>;
}

interface Header {
  date: moment.Moment;
  title: string;
  tag?: string;
}
