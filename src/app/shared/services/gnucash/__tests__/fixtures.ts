export const emptyFile = '';

// language=XML
export const fileWithOneTransaction = `
<?xml version="1.0" encoding="utf-8" ?>
<gnc-v2
     xmlns:gnc="http://www.gnucash.org/XML/gnc"
     xmlns:act="http://www.gnucash.org/XML/act"
     xmlns:book="http://www.gnucash.org/XML/book"
     xmlns:cd="http://www.gnucash.org/XML/cd"
     xmlns:cmdty="http://www.gnucash.org/XML/cmdty"
     xmlns:price="http://www.gnucash.org/XML/price"
     xmlns:slot="http://www.gnucash.org/XML/slot"
     xmlns:split="http://www.gnucash.org/XML/split"
     xmlns:sx="http://www.gnucash.org/XML/sx"
     xmlns:trn="http://www.gnucash.org/XML/trn"
     xmlns:ts="http://www.gnucash.org/XML/ts"
     xmlns:fs="http://www.gnucash.org/XML/fs"
     xmlns:bgt="http://www.gnucash.org/XML/bgt"
     xmlns:recurrence="http://www.gnucash.org/XML/recurrence"
     xmlns:lot="http://www.gnucash.org/XML/lot"
     xmlns:addr="http://www.gnucash.org/XML/addr"
     xmlns:owner="http://www.gnucash.org/XML/owner"
     xmlns:billterm="http://www.gnucash.org/XML/billterm"
     xmlns:bt-days="http://www.gnucash.org/XML/bt-days"
     xmlns:bt-prox="http://www.gnucash.org/XML/bt-prox"
     xmlns:cust="http://www.gnucash.org/XML/cust"
     xmlns:employee="http://www.gnucash.org/XML/employee"
     xmlns:entry="http://www.gnucash.org/XML/entry"
     xmlns:invoice="http://www.gnucash.org/XML/invoice"
     xmlns:job="http://www.gnucash.org/XML/job"
     xmlns:order="http://www.gnucash.org/XML/order"
     xmlns:taxtable="http://www.gnucash.org/XML/taxtable"
     xmlns:tte="http://www.gnucash.org/XML/tte"
     xmlns:vendor="http://www.gnucash.org/XML/vendor">
  <gnc:count-data cd:type="book">1</gnc:count-data>
  <gnc:book version="2.0.0">
    <book:id type="guid">4bec3ac6cee4662f2710c71c3b3559db</book:id>
    <gnc:count-data cd:type="commodity">1</gnc:count-data>
    <gnc:count-data cd:type="account">112</gnc:count-data>
    <gnc:count-data cd:type="transaction">5453</gnc:count-data>
    <gnc:commodity version="2.0.0">
      <cmdty:space>ISO4217</cmdty:space>
      <cmdty:id>EUR</cmdty:id>
      <cmdty:get_quotes/>
      <cmdty:quote_source>currency</cmdty:quote_source>
      <cmdty:quote_tz/>
    </gnc:commodity>
    <gnc:commodity version="2.0.0">
      <cmdty:space>template</cmdty:space>
      <cmdty:id>template</cmdty:id>
      <cmdty:name>template</cmdty:name>
      <cmdty:xcode>template</cmdty:xcode>
      <cmdty:fraction>1</cmdty:fraction>
    </gnc:commodity>
    <gnc:account version="2.0.0">
      <act:name>Root Account</act:name>
      <act:id type="guid">8245bc93ce466663b78ca798e287b281</act:id>
      <act:type>ROOT</act:type>
    </gnc:account>
    <gnc:account version="2.0.0">
      <act:name>Actif</act:name>
      <act:id type="guid">cab49e67985013c6b79c04840f2cf1bb</act:id>
      <act:type>ASSET</act:type>
      <act:commodity>
        <cmdty:space>ISO4217</cmdty:space>
        <cmdty:id>EUR</cmdty:id>
      </act:commodity>
      <act:commodity-scu>100</act:commodity-scu>
      <act:description>Actif</act:description>
      <act:parent type="guid">8245bc93ce466663b78ca798e287b281</act:parent>
    </gnc:account>
    <gnc:account version="2.0.0">
      <act:name>Revenus</act:name>
      <act:id type="guid">49c5e616a0c5f140bf0d90e1ba68f156</act:id>
      <act:type>INCOME</act:type>
      <act:commodity>
        <cmdty:space>ISO4217</cmdty:space>
        <cmdty:id>EUR</cmdty:id>
      </act:commodity>
      <act:commodity-scu>100</act:commodity-scu>
      <act:description>Revenus</act:description>
      <act:parent type="guid">8245bc93ce466663b78ca798e287b281</act:parent>
    </gnc:account>
    <gnc:transaction version="2.0.0">
      <trn:id type="guid">cad8aeb5313c46f9523fcb6d1dc60f8b</trn:id>
      <trn:currency>
        <cmdty:space>ISO4217</cmdty:space>
        <cmdty:id>EUR</cmdty:id>
      </trn:currency>
      <trn:date-posted>
        <ts:date>2016-05-27 12:59:00 +0200</ts:date>
      </trn:date-posted>
      <trn:date-entered>
        <ts:date>2016-06-16 15:53:21 +0200</ts:date>
      </trn:date-entered>
      <trn:description>VIREMENT EMIS - renflouement fin mai</trn:description>
      <trn:slots>
        <slot>
          <slot:key>date-posted</slot:key>
          <slot:value type="gdate">
            <gdate>2016-05-27</gdate>
          </slot:value>
        </slot>
        <slot>
          <slot:key>notes</slot:key>
          <slot:value type="string">OFX ext. info: |Trans type:Other|Memo:WEB ORSINI BENJAMIN OU M renflou</slot:value>
        </slot>
      </trn:slots>
      <trn:splits>
        <trn:split>
          <split:id type="guid">bcf1373f525e4a1ef4e93c2aae66316a</split:id>
          <split:reconciled-state>y</split:reconciled-state>
          <split:reconcile-date>
            <ts:date>2015-08-10 23:59:59 +0200</ts:date>
          </split:reconcile-date>
          <split:value>10000/100</split:value>
          <split:quantity>10000/100</split:quantity>
          <split:account type="guid">cab49e67985013c6b79c04840f2cf1bb</split:account>
          <split:slots>
            <slot>
              <slot:key>online_id</slot:key>
              <slot:value type="string">4347550149984</slot:value>
            </slot>
          </split:slots>
        </trn:split>
        <trn:split>
          <split:id type="guid">c48e0117334d0385cc5603fb9e123948</split:id>
          <split:memo>WEB ORSINI BENJAMIN OU M renflou</split:memo>
          <split:reconciled-state>y</split:reconciled-state>
          <split:reconcile-date>
            <ts:date>2015-10-11 00:59:59 +0200</ts:date>
          </split:reconcile-date>
          <split:value>-10000/100</split:value>
          <split:quantity>-10000/100</split:quantity>
          <split:account type="guid">49c5e616a0c5f140bf0d90e1ba68f156</split:account>
          <split:slots>
            <slot>
              <slot:key>online_id</slot:key>
              <slot:value type="string">4347550149983</slot:value>
            </slot>
          </split:slots>
        </trn:split>
      </trn:splits>
    </gnc:transaction>
</gnc:book>
</gnc-v2>
`;

// language=XML
export const fileWithTwoTransactions = `
<?xml version="1.0" encoding="utf-8" ?>
<gnc-v2
     xmlns:gnc="http://www.gnucash.org/XML/gnc"
     xmlns:act="http://www.gnucash.org/XML/act"
     xmlns:book="http://www.gnucash.org/XML/book"
     xmlns:cd="http://www.gnucash.org/XML/cd"
     xmlns:cmdty="http://www.gnucash.org/XML/cmdty"
     xmlns:price="http://www.gnucash.org/XML/price"
     xmlns:slot="http://www.gnucash.org/XML/slot"
     xmlns:split="http://www.gnucash.org/XML/split"
     xmlns:sx="http://www.gnucash.org/XML/sx"
     xmlns:trn="http://www.gnucash.org/XML/trn"
     xmlns:ts="http://www.gnucash.org/XML/ts"
     xmlns:fs="http://www.gnucash.org/XML/fs"
     xmlns:bgt="http://www.gnucash.org/XML/bgt"
     xmlns:recurrence="http://www.gnucash.org/XML/recurrence"
     xmlns:lot="http://www.gnucash.org/XML/lot"
     xmlns:addr="http://www.gnucash.org/XML/addr"
     xmlns:owner="http://www.gnucash.org/XML/owner"
     xmlns:billterm="http://www.gnucash.org/XML/billterm"
     xmlns:bt-days="http://www.gnucash.org/XML/bt-days"
     xmlns:bt-prox="http://www.gnucash.org/XML/bt-prox"
     xmlns:cust="http://www.gnucash.org/XML/cust"
     xmlns:employee="http://www.gnucash.org/XML/employee"
     xmlns:entry="http://www.gnucash.org/XML/entry"
     xmlns:invoice="http://www.gnucash.org/XML/invoice"
     xmlns:job="http://www.gnucash.org/XML/job"
     xmlns:order="http://www.gnucash.org/XML/order"
     xmlns:taxtable="http://www.gnucash.org/XML/taxtable"
     xmlns:tte="http://www.gnucash.org/XML/tte"
     xmlns:vendor="http://www.gnucash.org/XML/vendor">
  <gnc:count-data cd:type="book">1</gnc:count-data>
  <gnc:book version="2.0.0">
    <book:id type="guid">4bec3ac6cee4662f2710c71c3b3559db</book:id>
    <gnc:count-data cd:type="commodity">1</gnc:count-data>
    <gnc:count-data cd:type="account">112</gnc:count-data>
    <gnc:count-data cd:type="transaction">5453</gnc:count-data>
    <gnc:commodity version="2.0.0">
      <cmdty:space>ISO4217</cmdty:space>
      <cmdty:id>EUR</cmdty:id>
      <cmdty:get_quotes/>
      <cmdty:quote_source>currency</cmdty:quote_source>
      <cmdty:quote_tz/>
    </gnc:commodity>
    <gnc:commodity version="2.0.0">
      <cmdty:space>template</cmdty:space>
      <cmdty:id>template</cmdty:id>
      <cmdty:name>template</cmdty:name>
      <cmdty:xcode>template</cmdty:xcode>
      <cmdty:fraction>1</cmdty:fraction>
    </gnc:commodity>
    <gnc:account version="2.0.0">
      <act:name>Root Account</act:name>
      <act:id type="guid">8245bc93ce466663b78ca798e287b281</act:id>
      <act:type>ROOT</act:type>
    </gnc:account>
    <gnc:account version="2.0.0">
      <act:name>Actif</act:name>
      <act:id type="guid">cab49e67985013c6b79c04840f2cf1bb</act:id>
      <act:type>ASSET</act:type>
      <act:commodity>
        <cmdty:space>ISO4217</cmdty:space>
        <cmdty:id>EUR</cmdty:id>
      </act:commodity>
      <act:commodity-scu>100</act:commodity-scu>
      <act:description>Actif</act:description>
      <act:parent type="guid">8245bc93ce466663b78ca798e287b281</act:parent>
    </gnc:account>
    <gnc:account version="2.0.0">
      <act:name>Revenus</act:name>
      <act:id type="guid">49c5e616a0c5f140bf0d90e1ba68f156</act:id>
      <act:type>INCOME</act:type>
      <act:commodity>
        <cmdty:space>ISO4217</cmdty:space>
        <cmdty:id>EUR</cmdty:id>
      </act:commodity>
      <act:commodity-scu>100</act:commodity-scu>
      <act:description>Revenus</act:description>
      <act:parent type="guid">8245bc93ce466663b78ca798e287b281</act:parent>
    </gnc:account>
    <gnc:transaction version="2.0.0">
      <trn:id type="guid">cad8aeb5313c46f9523fcb6d1dc60f8b</trn:id>
      <trn:currency>
        <cmdty:space>ISO4217</cmdty:space>
        <cmdty:id>EUR</cmdty:id>
      </trn:currency>
      <trn:date-posted>
        <ts:date>2016-05-27 12:59:00 +0200</ts:date>
      </trn:date-posted>
      <trn:date-entered>
        <ts:date>2016-06-16 15:53:21 +0200</ts:date>
      </trn:date-entered>
      <trn:description>VIREMENT EMIS - renflouement fin mai</trn:description>
      <trn:slots>
        <slot>
          <slot:key>date-posted</slot:key>
          <slot:value type="gdate">
            <gdate>2016-05-27</gdate>
          </slot:value>
        </slot>
        <slot>
          <slot:key>notes</slot:key>
          <slot:value type="string">OFX ext. info: |Trans type:Other|Memo:WEB ORSINI BENJAMIN OU M renflou</slot:value>
        </slot>
      </trn:slots>
      <trn:splits>
        <trn:split>
          <split:id type="guid">bcf1373f525e4a1ef4e93c2aae66316a</split:id>
          <split:reconciled-state>y</split:reconciled-state>
          <split:reconcile-date>
            <ts:date>2015-08-10 23:59:59 +0200</ts:date>
          </split:reconcile-date>
          <split:value>10000/100</split:value>
          <split:quantity>10000/100</split:quantity>
          <split:account type="guid">cab49e67985013c6b79c04840f2cf1bb</split:account>
          <split:slots>
            <slot>
              <slot:key>online_id</slot:key>
              <slot:value type="string">4347550149984</slot:value>
            </slot>
          </split:slots>
        </trn:split>
        <trn:split>
          <split:id type="guid">c48e0117334d0385cc5603fb9e123948</split:id>
          <split:memo>WEB ORSINI BENJAMIN OU M renflou</split:memo>
          <split:reconciled-state>y</split:reconciled-state>
          <split:reconcile-date>
            <ts:date>2015-10-11 00:59:59 +0200</ts:date>
          </split:reconcile-date>
          <split:value>-10000/100</split:value>
          <split:quantity>-10000/100</split:quantity>
          <split:account type="guid">49c5e616a0c5f140bf0d90e1ba68f156</split:account>
          <split:slots>
            <slot>
              <slot:key>online_id</slot:key>
              <slot:value type="string">4347550149983</slot:value>
            </slot>
          </split:slots>
        </trn:split>
      </trn:splits>
    </gnc:transaction>
    <gnc:transaction version="2.0.0">
      <trn:id type="guid">b3f48a09358f06fd718dbcf51ba5e974</trn:id>
      <trn:currency>
        <cmdty:space>ISO4217</cmdty:space>
        <cmdty:id>EUR</cmdty:id>
      </trn:currency>
      <trn:date-posted>
        <ts:date>2016-05-30 12:59:00 +0200</ts:date>
      </trn:date-posted>
      <trn:date-entered>
        <ts:date>2016-06-16 15:53:21 +0200</ts:date>
      </trn:date-entered>
      <trn:description>LEROY MERLIN MERIGNAC 27/05</trn:description>
      <trn:slots>
        <slot>
          <slot:key>date-posted</slot:key>
          <slot:value type="gdate">
            <gdate>2016-05-30</gdate>
          </slot:value>
        </slot>
        <slot>
          <slot:key>notes</slot:key>
          <slot:value type="string">OFX ext. info: |Trans type:Other|Memo:PAIEMENT PAR CARTE</slot:value>
        </slot>
      </trn:slots>
      <trn:splits>
        <trn:split>
          <split:id type="guid">7fc66d9ce7b7de7e4a33ebdd3ec9fa03</split:id>
          <split:reconciled-state>n</split:reconciled-state>
          <split:value>10080/100</split:value>
          <split:quantity>10080/100</split:quantity>
          <split:account type="guid">cab49e67985013c6b79c04840f2cf1bb</split:account>
        </trn:split>
        <trn:split>
          <split:id type="guid">d0aad622124825cd315dafe71897bcfc</split:id>
          <split:memo>PAIEMENT PAR CARTE</split:memo>
          <split:reconciled-state>y</split:reconciled-state>
          <split:reconcile-date>
            <ts:date>2015-08-10 23:59:59 +0200</ts:date>
          </split:reconcile-date>
          <split:value>-10080/100</split:value>
          <split:quantity>-10080/100</split:quantity>
          <split:account type="guid">49c5e616a0c5f140bf0d90e1ba68f156</split:account>
          <split:slots>
            <slot>
              <slot:key>online_id</slot:key>
              <slot:value type="string">4356210461442</slot:value>
            </slot>
          </split:slots>
        </trn:split>
      </trn:splits>
    </gnc:transaction>
</gnc:book>
</gnc-v2>
`;

// language=XML
export const fileWithOneSplit = `
<?xml version="1.0" encoding="utf-8" ?>
<gnc-v2
     xmlns:gnc="http://www.gnucash.org/XML/gnc"
     xmlns:act="http://www.gnucash.org/XML/act"
     xmlns:book="http://www.gnucash.org/XML/book"
     xmlns:cd="http://www.gnucash.org/XML/cd"
     xmlns:cmdty="http://www.gnucash.org/XML/cmdty"
     xmlns:price="http://www.gnucash.org/XML/price"
     xmlns:slot="http://www.gnucash.org/XML/slot"
     xmlns:split="http://www.gnucash.org/XML/split"
     xmlns:sx="http://www.gnucash.org/XML/sx"
     xmlns:trn="http://www.gnucash.org/XML/trn"
     xmlns:ts="http://www.gnucash.org/XML/ts"
     xmlns:fs="http://www.gnucash.org/XML/fs"
     xmlns:bgt="http://www.gnucash.org/XML/bgt"
     xmlns:recurrence="http://www.gnucash.org/XML/recurrence"
     xmlns:lot="http://www.gnucash.org/XML/lot"
     xmlns:addr="http://www.gnucash.org/XML/addr"
     xmlns:owner="http://www.gnucash.org/XML/owner"
     xmlns:billterm="http://www.gnucash.org/XML/billterm"
     xmlns:bt-days="http://www.gnucash.org/XML/bt-days"
     xmlns:bt-prox="http://www.gnucash.org/XML/bt-prox"
     xmlns:cust="http://www.gnucash.org/XML/cust"
     xmlns:employee="http://www.gnucash.org/XML/employee"
     xmlns:entry="http://www.gnucash.org/XML/entry"
     xmlns:invoice="http://www.gnucash.org/XML/invoice"
     xmlns:job="http://www.gnucash.org/XML/job"
     xmlns:order="http://www.gnucash.org/XML/order"
     xmlns:taxtable="http://www.gnucash.org/XML/taxtable"
     xmlns:tte="http://www.gnucash.org/XML/tte"
     xmlns:vendor="http://www.gnucash.org/XML/vendor">
  <gnc:count-data cd:type="book">1</gnc:count-data>
  <gnc:book version="2.0.0">
    <book:id type="guid">4bec3ac6cee4662f2710c71c3b3559db</book:id>
    <gnc:count-data cd:type="commodity">1</gnc:count-data>
    <gnc:count-data cd:type="account">112</gnc:count-data>
    <gnc:count-data cd:type="transaction">5453</gnc:count-data>
    <gnc:commodity version="2.0.0">
      <cmdty:space>ISO4217</cmdty:space>
      <cmdty:id>EUR</cmdty:id>
      <cmdty:get_quotes/>
      <cmdty:quote_source>currency</cmdty:quote_source>
      <cmdty:quote_tz/>
    </gnc:commodity>
    <gnc:commodity version="2.0.0">
      <cmdty:space>template</cmdty:space>
      <cmdty:id>template</cmdty:id>
      <cmdty:name>template</cmdty:name>
      <cmdty:xcode>template</cmdty:xcode>
      <cmdty:fraction>1</cmdty:fraction>
    </gnc:commodity>
    <gnc:account version="2.0.0">
      <act:name>Root Account</act:name>
      <act:id type="guid">8245bc93ce466663b78ca798e287b281</act:id>
      <act:type>ROOT</act:type>
    </gnc:account>
    <gnc:account version="2.0.0">
      <act:name>Root Account</act:name>
      <act:id type="guid">8245bc93ce466663b78ca798e287b281</act:id>
      <act:type>ROOT</act:type>
    </gnc:account>
    <gnc:account version="2.0.0">
      <act:name>Actif</act:name>
      <act:id type="guid">cab49e67985013c6b79c04840f2cf1bb</act:id>
      <act:type>ASSET</act:type>
      <act:commodity>
        <cmdty:space>ISO4217</cmdty:space>
        <cmdty:id>EUR</cmdty:id>
      </act:commodity>
      <act:commodity-scu>100</act:commodity-scu>
      <act:description>Actif</act:description>
      <act:parent type="guid">8245bc93ce466663b78ca798e287b281</act:parent>
    </gnc:account>
    <gnc:account version="2.0.0">
      <act:name>Revenus</act:name>
      <act:id type="guid">49c5e616a0c5f140bf0d90e1ba68f156</act:id>
      <act:type>INCOME</act:type>
      <act:commodity>
        <cmdty:space>ISO4217</cmdty:space>
        <cmdty:id>EUR</cmdty:id>
      </act:commodity>
      <act:commodity-scu>100</act:commodity-scu>
      <act:description>Revenus</act:description>
      <act:parent type="guid">8245bc93ce466663b78ca798e287b281</act:parent>
    </gnc:account>
    <gnc:transaction version="2.0.0">
      <trn:id type="guid">cad8aeb5313c46f9523fcb6d1dc60f8b</trn:id>
      <trn:currency>
        <cmdty:space>ISO4217</cmdty:space>
        <cmdty:id>EUR</cmdty:id>
      </trn:currency>
      <trn:date-posted>
        <ts:date>2016-05-27 12:59:00 +0200</ts:date>
      </trn:date-posted>
      <trn:date-entered>
        <ts:date>2016-06-16 15:53:21 +0200</ts:date>
      </trn:date-entered>
      <trn:description>VIREMENT EMIS - renflouement fin mai</trn:description>
      <trn:slots>
        <slot>
          <slot:key>date-posted</slot:key>
          <slot:value type="gdate">
            <gdate>2016-05-27</gdate>
          </slot:value>
        </slot>
        <slot>
          <slot:key>notes</slot:key>
          <slot:value type="string">OFX ext. info: |Trans type:Other|Memo:WEB ORSINI BENJAMIN OU M renflou</slot:value>
        </slot>
      </trn:slots>
      <trn:splits>
        <trn:split>
          <split:id type="guid">bcf1373f525e4a1ef4e93c2aae66316a</split:id>
          <split:reconciled-state>y</split:reconciled-state>
          <split:reconcile-date>
            <ts:date>2015-08-10 23:59:59 +0200</ts:date>
          </split:reconcile-date>
          <split:value>10000/100</split:value>
          <split:quantity>10000/100</split:quantity>
          <split:account type="guid">cab49e67985013c6b79c04840f2cf1bb</split:account>
          <split:slots>
            <slot>
              <slot:key>online_id</slot:key>
              <slot:value type="string">4347550149984</slot:value>
            </slot>
          </split:slots>
        </trn:split>
      </trn:splits>
    </gnc:transaction>
</gnc:book>
</gnc-v2>
`;

// language=XML
export const fileWithNoAMount = `
<?xml version="1.0" encoding="utf-8" ?>
<gnc-v2
     xmlns:gnc="http://www.gnucash.org/XML/gnc"
     xmlns:act="http://www.gnucash.org/XML/act"
     xmlns:book="http://www.gnucash.org/XML/book"
     xmlns:cd="http://www.gnucash.org/XML/cd"
     xmlns:cmdty="http://www.gnucash.org/XML/cmdty"
     xmlns:price="http://www.gnucash.org/XML/price"
     xmlns:slot="http://www.gnucash.org/XML/slot"
     xmlns:split="http://www.gnucash.org/XML/split"
     xmlns:sx="http://www.gnucash.org/XML/sx"
     xmlns:trn="http://www.gnucash.org/XML/trn"
     xmlns:ts="http://www.gnucash.org/XML/ts"
     xmlns:fs="http://www.gnucash.org/XML/fs"
     xmlns:bgt="http://www.gnucash.org/XML/bgt"
     xmlns:recurrence="http://www.gnucash.org/XML/recurrence"
     xmlns:lot="http://www.gnucash.org/XML/lot"
     xmlns:addr="http://www.gnucash.org/XML/addr"
     xmlns:owner="http://www.gnucash.org/XML/owner"
     xmlns:billterm="http://www.gnucash.org/XML/billterm"
     xmlns:bt-days="http://www.gnucash.org/XML/bt-days"
     xmlns:bt-prox="http://www.gnucash.org/XML/bt-prox"
     xmlns:cust="http://www.gnucash.org/XML/cust"
     xmlns:employee="http://www.gnucash.org/XML/employee"
     xmlns:entry="http://www.gnucash.org/XML/entry"
     xmlns:invoice="http://www.gnucash.org/XML/invoice"
     xmlns:job="http://www.gnucash.org/XML/job"
     xmlns:order="http://www.gnucash.org/XML/order"
     xmlns:taxtable="http://www.gnucash.org/XML/taxtable"
     xmlns:tte="http://www.gnucash.org/XML/tte"
     xmlns:vendor="http://www.gnucash.org/XML/vendor">
  <gnc:count-data cd:type="book">1</gnc:count-data>
  <gnc:book version="2.0.0">
    <book:id type="guid">4bec3ac6cee4662f2710c71c3b3559db</book:id>
    <gnc:count-data cd:type="commodity">1</gnc:count-data>
    <gnc:count-data cd:type="account">112</gnc:count-data>
    <gnc:count-data cd:type="transaction">5453</gnc:count-data>
    <gnc:commodity version="2.0.0">
      <cmdty:space>ISO4217</cmdty:space>
      <cmdty:id>EUR</cmdty:id>
      <cmdty:get_quotes/>
      <cmdty:quote_source>currency</cmdty:quote_source>
      <cmdty:quote_tz/>
    </gnc:commodity>
    <gnc:commodity version="2.0.0">
      <cmdty:space>template</cmdty:space>
      <cmdty:id>template</cmdty:id>
      <cmdty:name>template</cmdty:name>
      <cmdty:xcode>template</cmdty:xcode>
      <cmdty:fraction>1</cmdty:fraction>
    </gnc:commodity>
    <gnc:account version="2.0.0">
      <act:name>Root Account</act:name>
      <act:id type="guid">8245bc93ce466663b78ca798e287b281</act:id>
      <act:type>ROOT</act:type>
    </gnc:account>
    <gnc:account version="2.0.0">
      <act:name>Root Account</act:name>
      <act:id type="guid">8245bc93ce466663b78ca798e287b281</act:id>
      <act:type>ROOT</act:type>
    </gnc:account>
    <gnc:account version="2.0.0">
      <act:name>Actif</act:name>
      <act:id type="guid">cab49e67985013c6b79c04840f2cf1bb</act:id>
      <act:type>ASSET</act:type>
      <act:commodity>
        <cmdty:space>ISO4217</cmdty:space>
        <cmdty:id>EUR</cmdty:id>
      </act:commodity>
      <act:commodity-scu>100</act:commodity-scu>
      <act:description>Actif</act:description>
      <act:parent type="guid">8245bc93ce466663b78ca798e287b281</act:parent>
    </gnc:account>
    <gnc:account version="2.0.0">
      <act:name>Revenus</act:name>
      <act:id type="guid">49c5e616a0c5f140bf0d90e1ba68f156</act:id>
      <act:type>INCOME</act:type>
      <act:commodity>
        <cmdty:space>ISO4217</cmdty:space>
        <cmdty:id>EUR</cmdty:id>
      </act:commodity>
      <act:commodity-scu>100</act:commodity-scu>
      <act:description>Revenus</act:description>
      <act:parent type="guid">8245bc93ce466663b78ca798e287b281</act:parent>
    </gnc:account>
    <gnc:transaction version="2.0.0">
      <trn:id type="guid">cad8aeb5313c46f9523fcb6d1dc60f8b</trn:id>
      <trn:currency>
        <cmdty:space>ISO4217</cmdty:space>
        <cmdty:id>EUR</cmdty:id>
      </trn:currency>
      <trn:date-posted>
        <ts:date>2016-05-27 12:59:00 +0200</ts:date>
      </trn:date-posted>
      <trn:date-entered>
        <ts:date>2016-06-16 15:53:21 +0200</ts:date>
      </trn:date-entered>
      <trn:description>VIREMENT EMIS - renflouement fin mai</trn:description>
      <trn:slots>
        <slot>
          <slot:key>date-posted</slot:key>
          <slot:value type="gdate">
            <gdate>2016-05-27</gdate>
          </slot:value>
        </slot>
        <slot>
          <slot:key>notes</slot:key>
          <slot:value type="string">OFX ext. info: |Trans type:Other|Memo:WEB ORSINI BENJAMIN OU M renflou</slot:value>
        </slot>
      </trn:slots>
      <trn:splits>
        <trn:split>
          <split:id type="guid">bcf1373f525e4a1ef4e93c2aae66316a</split:id>
          <split:reconciled-state>y</split:reconciled-state>
          <split:reconcile-date>
            <ts:date>2015-08-10 23:59:59 +0200</ts:date>
          </split:reconcile-date>
          <split:value></split:value>
          <split:quantity>10000/100</split:quantity>
          <split:account type="guid">cab49e67985013c6b79c04840f2cf1bb</split:account>
          <split:slots>
            <slot>
              <slot:key>online_id</slot:key>
              <slot:value type="string">4347550149984</slot:value>
            </slot>
          </split:slots>
        </trn:split>
      </trn:splits>
    </gnc:transaction>
</gnc:book>
</gnc-v2>
`;


// language=XML
export const fileWithLineBreak = `
<?xml version="1.0" encoding="utf-8" ?>
<gnc-v2
     xmlns:gnc="http://www.gnucash.org/XML/gnc"
     xmlns:act="http://www.gnucash.org/XML/act"
     xmlns:book="http://www.gnucash.org/XML/book"
     xmlns:cd="http://www.gnucash.org/XML/cd"
     xmlns:cmdty="http://www.gnucash.org/XML/cmdty"
     xmlns:price="http://www.gnucash.org/XML/price"
     xmlns:slot="http://www.gnucash.org/XML/slot"
     xmlns:split="http://www.gnucash.org/XML/split"
     xmlns:sx="http://www.gnucash.org/XML/sx"
     xmlns:trn="http://www.gnucash.org/XML/trn"
     xmlns:ts="http://www.gnucash.org/XML/ts"
     xmlns:fs="http://www.gnucash.org/XML/fs"
     xmlns:bgt="http://www.gnucash.org/XML/bgt"
     xmlns:recurrence="http://www.gnucash.org/XML/recurrence"
     xmlns:lot="http://www.gnucash.org/XML/lot"
     xmlns:addr="http://www.gnucash.org/XML/addr"
     xmlns:owner="http://www.gnucash.org/XML/owner"
     xmlns:billterm="http://www.gnucash.org/XML/billterm"
     xmlns:bt-days="http://www.gnucash.org/XML/bt-days"
     xmlns:bt-prox="http://www.gnucash.org/XML/bt-prox"
     xmlns:cust="http://www.gnucash.org/XML/cust"
     xmlns:employee="http://www.gnucash.org/XML/employee"
     xmlns:entry="http://www.gnucash.org/XML/entry"
     xmlns:invoice="http://www.gnucash.org/XML/invoice"
     xmlns:job="http://www.gnucash.org/XML/job"
     xmlns:order="http://www.gnucash.org/XML/order"
     xmlns:taxtable="http://www.gnucash.org/XML/taxtable"
     xmlns:tte="http://www.gnucash.org/XML/tte"
     xmlns:vendor="http://www.gnucash.org/XML/vendor">
  <gnc:count-data cd:type="book">1</gnc:count-data>
  <gnc:book version="2.0.0">
    <book:id type="guid">4bec3ac6cee4662f2710c71c3b3559db</book:id>
    <gnc:count-data cd:type="commodity">1</gnc:count-data>
    <gnc:count-data cd:type="account">112</gnc:count-data>
    <gnc:count-data cd:type="transaction">5453</gnc:count-data>
    <gnc:commodity version="2.0.0">
      <cmdty:space>ISO4217</cmdty:space>
      <cmdty:id>EUR</cmdty:id>
      <cmdty:get_quotes/>
      <cmdty:quote_source>currency</cmdty:quote_source>
      <cmdty:quote_tz/>
    </gnc:commodity>
    <gnc:commodity version="2.0.0">
      <cmdty:space>template</cmdty:space>
      <cmdty:id>template</cmdty:id>
      <cmdty:name>template</cmdty:name>
      <cmdty:xcode>template</cmdty:xcode>
      <cmdty:fraction>1</cmdty:fraction>
    </gnc:commodity>
    <gnc:account version="2.0.0">
      <act:name>Root Account</act:name>
      <act:id type="guid">8245bc93ce466663b78ca798e287b281</act:id>
      <act:type>ROOT</act:type>
    </gnc:account>
    <gnc:account version="2.0.0">
      <act:name>Actif</act:name>
      <act:id type="guid">cab49e67985013c6b79c04840f2cf1bb</act:id>
      <act:type>ASSET</act:type>
      <act:commodity>
        <cmdty:space>ISO4217</cmdty:space>
        <cmdty:id>EUR</cmdty:id>
      </act:commodity>
      <act:commodity-scu>100</act:commodity-scu>
      <act:description>Actif</act:description>
      <act:parent type="guid">8245bc93ce466663b78ca798e287b281</act:parent>
    </gnc:account>
    <gnc:account version="2.0.0">
      <act:name>Revenus</act:name>
      <act:id type="guid">49c5e616a0c5f140bf0d90e1ba68f156</act:id>
      <act:type>INCOME</act:type>
      <act:commodity>
        <cmdty:space>ISO4217</cmdty:space>
        <cmdty:id>EUR</cmdty:id>
      </act:commodity>
      <act:commodity-scu>100</act:commodity-scu>
      <act:description>Revenus</act:description>
      <act:parent type="guid">8245bc93ce466663b78ca798e287b281</act:parent>
    </gnc:account>
    <gnc:transaction version="2.0.0">
      <trn:id type="guid">cad8aeb5313c46f9523fcb6d1dc60f8b</trn:id>
      <trn:currency>
        <cmdty:space>ISO4217</cmdty:space>
        <cmdty:id>EUR</cmdty:id>
      </trn:currency>
      <trn:date-posted>
        <ts:date>2016-05-27 12:59:00 +0200</ts:date>
      </trn:date-posted>
      <trn:date-entered>
        <ts:date>2016-06-16 15:53:21 +0200</ts:date>
      </trn:date-entered>
      <trn:description>VIREMENT EMIS - 
        renflouement fin mai</trn:description>
      <trn:slots>
        <slot>
          <slot:key>date-posted</slot:key>
          <slot:value type="gdate">
            <gdate>2016-05-27</gdate>
          </slot:value>
        </slot>
        <slot>
          <slot:key>notes</slot:key>
          <slot:value type="string">OFX ext. info: |Trans type:Other|Memo:WEB ORSINI BENJAMIN OU M renflou</slot:value>
        </slot>
      </trn:slots>
      <trn:splits>
        <trn:split>
          <split:id type="guid">bcf1373f525e4a1ef4e93c2aae66316a</split:id>
          <split:reconciled-state>y</split:reconciled-state>
          <split:reconcile-date>
            <ts:date>2015-08-10 23:59:59 +0200</ts:date>
          </split:reconcile-date>
          <split:value>10000/100</split:value>
          <split:quantity>10000/100</split:quantity>
          <split:account type="guid">cab49e67985013c6b79c04840f2cf1bb</split:account>
          <split:slots>
            <slot>
              <slot:key>online_id</slot:key>
              <slot:value type="string">4347550149984</slot:value>
            </slot>
          </split:slots>
        </trn:split>
        <trn:split>
          <split:id type="guid">c48e0117334d0385cc5603fb9e123948</split:id>
          <split:memo>WEB ORSINI BENJAMIN OU M renflou</split:memo>
          <split:reconciled-state>y</split:reconciled-state>
          <split:reconcile-date>
            <ts:date>2015-10-11 00:59:59 +0200</ts:date>
          </split:reconcile-date>
          <split:value>-10000/100</split:value>
          <split:quantity>-10000/100</split:quantity>
          <split:account type="guid">49c5e616a0c5f140bf0d90e1ba68f156</split:account>
          <split:slots>
            <slot>
              <slot:key>online_id</slot:key>
              <slot:value type="string">4347550149983</slot:value>
            </slot>
          </split:slots>
        </trn:split>
      </trn:splits>
    </gnc:transaction>
</gnc:book>
</gnc-v2>
`;
