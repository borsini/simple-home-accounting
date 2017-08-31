import { Injectable } from '@angular/core';
import {Observable} from 'rxjs'
import { Account, Transaction } from './models/models'
import * as moment from "moment"

@Injectable()
export class OfxService {

  constructor() { }

  parseOfxString(ofxString: string) : Observable<Transaction[]>{
    return new Observable( obs => {
      let xmlOfx = ofxString
      // Remove empty spaces and line breaks between tags
      .replace(/>\s+</g, '><')
      // Remove empty spaces and line breaks before tags content
      .replace(/\s+</g, '<')
      // Remove empty spaces and line breaks after tags content
      .replace(/>\s+/g, '>')
      // Remove dots in start-tags names and remove end-tags with dots
      .replace(/<([A-Z0-9_]*)+\.+([A-Z0-9_]*)>([^<]+)(<\/\1\.\2>)?/g, '<\$1\$2>\$3' )
      // Add a new end-tags for the ofx elements
      .replace(/<(\w+?)>([^<]+)/g, '<\$1>\$2</<added>\$1>')
      // Remove duplicate end-tags
      .replace(/<\/<added>(\w+?)>(<\/\1>)?/g, '</\$1>')

      let jsOfx = this.xmlToJson(new DOMParser().parseFromString(xmlOfx, "text/xml"))
      console.log(jsOfx)

      let transactions : Transaction[] = []

      let STMTTRNRS = jsOfx.OFX.BANKMSGSRSV1.STMTTRNRS

        if(!(STMTTRNRS instanceof Array)) {
            STMTTRNRS = [STMTTRNRS]
        }

    STMTTRNRS.forEach(trList => {
        let c = trList.STMTRS.CURDEF['#text']
        let acc = trList.STMTRS.BANKACCTFROM.ACCTID['#text']

        let STMTTRN : any = trList.STMTRS.BANKTRANLIST.STMTTRN

        if(!(STMTTRN instanceof Array)) {
            STMTTRN = [STMTTRN]
        }
        
        STMTTRN.forEach(tr => {

          let d = moment(tr.DTPOSTED['#text'], "YYYYMMDD")
          let a = tr.TRNAMT['#text']
          let n = tr.NAME['#text']
          let m = tr.MEMO['#text']

          let t: Transaction = {
              uuid: undefined,
              header: {
                  tag: "",
                  date: d,
                  title: n
              },
              postings: [
                  {
                      tag: "",
                      account: acc,
                      amount: parseFloat(a),
                      currency: c,
                      comment: m
                  }
              ]
          }
          transactions.push(t)
        })
      })

      obs.next(transactions)
      obs.complete()
    })    
  }


    // Changes XML to JSON
    xmlToJson(xml: Node) : any {
      // Create the return object
      var obj = {};

      if (xml.nodeType == 1) { // element
          // do attributes
          if (xml.attributes.length > 0) {
          obj["@attributes"] = {};
              for (var j = 0; j < xml.attributes.length; j++) {
                  var attribute = xml.attributes.item(j);
                  obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
              }
          }
      } else if (xml.nodeType == 3) { // text
          obj = xml.nodeValue || "";
      }

      // do children
      if (xml.hasChildNodes()) {
          for(var i = 0; i < xml.childNodes.length; i++) {
              let item = xml.childNodes.item(i);
              var nodeName = item.nodeName;
              if (typeof(obj[nodeName]) == "undefined") {
                  obj[nodeName] = this.xmlToJson(item);
              } else {
                  if (typeof(obj[nodeName].push) == "undefined") {
                      var old = obj[nodeName];
                      obj[nodeName] = [];
                      obj[nodeName].push(old);
                  }
                  obj[nodeName].push(this.xmlToJson(item));
              }
          }
      }
      return obj;
  };
}
