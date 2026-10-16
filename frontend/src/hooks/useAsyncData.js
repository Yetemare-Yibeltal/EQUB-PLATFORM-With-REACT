import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../utils/errors";

export function useAsyncData(loader) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;

    setState((current) => ({ ...current, loading: true, error: "" }));

    loader()
      .then((data) => {
        if (active) setState({ data, loading: false, error: "" });
      })
      .catch((error) => {
        if (active) {
          setState((current) => ({
            ...current,
            loading: false,
            error: getErrorMessage(error),
          }));
        }
      });

    return () => {
      active = false;
    };
  }, [loader, version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  return { ...state, reload };
}
