import { useOutletContext } from "react-router-dom";

export function useGroup() {
  return useOutletContext();
}


