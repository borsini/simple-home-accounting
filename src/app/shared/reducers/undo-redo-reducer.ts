import { Reducer, AnyAction } from 'redux';

export interface UndoRedoState<S> {
  past: S[];
  present: S;
  future: S[];
}

export class UndoRedoActions {
  static readonly UNDO = 'UNDO';
  static readonly REDO = 'REDO';


  static undo(): AnyAction {
    return {
      type: UndoRedoActions.UNDO,
    };
  }

  static redo(): AnyAction {
    return {
      type: UndoRedoActions.REDO,
    };
  }
}

export const presentSelector = <A, B>(selector: (A) => B) => (state: UndoRedoState<A>) => selector(state.present);

export const pastSelector = <A>(state: UndoRedoState<A>): A[] => {
  return state.past;
};

export const futureSelector = <A>(state: UndoRedoState<A>): A[] => {
  return state.future;
};

export function undoRedoReducer<T>(reducer: Reducer<T>, actionsAllowed: string[]): Reducer<UndoRedoState<T>> {
  return function (state: UndoRedoState<T>, action: AnyAction): UndoRedoState<T> {
    const { past, present, future } = state;

    switch (action.type) {
      case UndoRedoActions.UNDO:
        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);
        return {
          past: newPast,
          present: previous,
          future: [present, ...future],
        };

      case UndoRedoActions.REDO:
        const next = future[0];
        const newFuture = future.slice(1);
        return {
          past: [...past, present],
          present: next,
          future: newFuture,
        };
      default:
        // Delegate handling the action to the passed reducer
        const newPresent = reducer(present, action);
        if (present === newPresent) {
          return state;
        }

        if (actionsAllowed.includes(action.type)) {
          const tempPast = [...past, present];
          return {
            past: tempPast.length > 5 ? tempPast.slice(1) : tempPast,
            present: newPresent,
            future: [],
          };
        } else {
          return {
            past: [...past],
            present: newPresent,
            future: [...future],
          };
        }
    }
  };
}
