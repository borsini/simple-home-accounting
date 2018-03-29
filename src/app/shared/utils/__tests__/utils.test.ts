import { differenceReducer, concatReducer, unionReducer, intersectionReducer } from '../utils';

describe(concatReducer.name, () => {
    it('works :)', () => {
      expect(concatReducer([], [])).toEqual([]);
      expect(concatReducer([1, 2], [])).toEqual([1, 2]);
      expect(concatReducer([], [3, 4])).toEqual([3, 4]);
      expect(concatReducer([1, 2], [2, 3])).toEqual([1, 2, 2, 3]);
    });
  });
  
  describe(unionReducer.name, () => {
    it('works :)', () => {
      expect(unionReducer([], [])).toEqual([]);
      expect(unionReducer([1, 2], [])).toEqual([1, 2]);
      expect(unionReducer([], [3, 4])).toEqual([3, 4]);
      expect(unionReducer([1, 2], [2, 3])).toEqual([1, 2, 3]);
    });
  });
  
  describe(differenceReducer.name, () => {
    it('works :)', () => {
      expect(differenceReducer([], [])).toEqual([]);
      expect(differenceReducer([1, 2], [])).toEqual([1, 2]);
      expect(differenceReducer([], [1, 2])).toEqual([]);
      expect(differenceReducer([1, 2], [1, 2])).toEqual([]);
    });
  });
  
  describe(intersectionReducer.name, () => {
    it('works :)', () => {
      expect(intersectionReducer([], [])).toEqual([]);
      expect(intersectionReducer([1, 2], [])).toEqual([]);
      expect(intersectionReducer([], [1, 2])).toEqual([]);
      expect(intersectionReducer([1, 2], [2, 3])).toEqual([2]);
    });
  });