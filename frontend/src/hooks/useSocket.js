import { useContext } from "react";
import { SocketContext } from "../context/contexts";

export function useSocket() {
  return useContext(SocketContext);
}
