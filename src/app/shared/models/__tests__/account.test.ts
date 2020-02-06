import { Account } from '../account';
import Decimal from 'decimal.js';

describe(Account.name, () => {
    it('adds two accounts', () => {
      const a1 = new Account("A")
      a1.balance = new Decimal(-4)
      a1.credits = new Decimal(6)
      a1.debits = new Decimal(10)
      a1.children = ["C2"]
      a1.childrenBalance = new Decimal(1)
      a1.childrenCredits = new Decimal(3)
      a1.childrenDebits = new Decimal(2)
      a1.nbChildrenTransactions = 4
      a1.nbTransactions = 5
      a1.parent = "ROOT"
  
      const a2 = new Account("A")
      a2.balance = new Decimal(-4)
      a2.credits = new Decimal(6)
      a2.debits = new Decimal(10)
      a2.children = ["C1"]
      a2.childrenBalance = new Decimal(1)
      a2.childrenCredits = new Decimal(3)
      a2.childrenDebits = new Decimal(2)
      a2.nbChildrenTransactions = 4
      a2.nbTransactions = 5
      a2.parent = "ROOT"

      const result = a1.plus(a2)
  
      expect(result.name).toEqual("A")
      expect(result.balance).toEqual(new Decimal(-8))
      expect(result.credits).toEqual(new Decimal(12))
      expect(result.debits).toEqual(new Decimal(20))
      expect(result.children).toEqual(["C1", "C2"])
      expect(result.childrenBalance).toEqual(new Decimal(2))
      expect(result.childrenCredits).toEqual(new Decimal(6))
      expect(result.childrenDebits).toEqual(new Decimal(4))
      expect(result.nbChildrenTransactions).toEqual(8)
      expect(result.nbTransactions).toEqual(10)
      expect(result.parent).toEqual("ROOT")
    });
  })
  