import {
  createContext,
  useCallback,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

import { ToastContainer } from "../components/Toast/ToastContainer";
import type { ToastItem, ToastVariant } from "../components/Toast/types";

interface ToastContextValue {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_TOASTS = 4;

type Action =
  | {
      type: "ADD";
      payload: ToastItem;
    }
  | {
      type: "REMOVE";
      payload: string;
    };

function reducer(state: ToastItem[], action: Action): ToastItem[] {
  switch (action.type) {
    case "ADD":
      return [action.payload, ...state].slice(0, MAX_TOASTS);

    case "REMOVE":
      return state.filter((toast) => toast.id !== action.payload);

    default:
      return state;
  }
}

interface Props {
  children: ReactNode;
}

export function ToastProvider({ children }: Props) {
  const [toasts, dispatch] = useReducer(reducer, []);

  const removeToast = useCallback((id: string) => {
    dispatch({
      type: "REMOVE",
      payload: id,
    });
  }, []);

  const createToast = useCallback(
    (
      variant: ToastVariant,
      title: string,
      description?: string
    ) => {
      const id = crypto.randomUUID();

      dispatch({
        type: "ADD",
        payload: {
          id,
          variant,
          title,
          description,
        },
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      success: (title: string, description?: string) =>
        createToast("success", title, description),

      error: (title: string, description?: string) =>
        createToast("error", title, description),

      warning: (title: string, description?: string) =>
        createToast("warning", title, description),

      info: (title: string, description?: string) =>
        createToast("info", title, description),

      removeToast,
    }),
    [createToast, removeToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
      />
    </ToastContext.Provider>
  );
}