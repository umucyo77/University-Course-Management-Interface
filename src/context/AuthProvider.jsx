import React, { useMemo, useState } from "react";
import { AuthContext } from "./authContext";

const readStoredUser = () => {
    const savedUser = localStorage.getItem("user");
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
        localStorage.removeItem("user");
        return null;
    }

    if (!savedUser || savedUser === "undefined" || savedUser === "null") {
        return null;
    }

    try {
        return JSON.parse(savedUser);
    } catch {
        localStorage.removeItem("user");
        return null;
    }
};

 export const AuthProvider=({ children})=>{
    const [user,setUser]=useState(readStoredUser);

    const login=(userData)=>{
        setUser(userData);
        localStorage.setItem("user",JSON.stringify(userData));
    };

    const logout=()=>{
        setUser(null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
    };

    const value = useMemo(
        () => ({
            user,
            isAuthenticated: Boolean(user && localStorage.getItem("accessToken")),
            login,
            logout,
        }),
        [user]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
