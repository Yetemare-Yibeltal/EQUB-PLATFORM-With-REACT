import { createContext } from "react";

export const AuthContext = createContext(null);

export const SocketContext = createContext({ socket: null, connected: false });

export const ThemeContext = createContext(null);
