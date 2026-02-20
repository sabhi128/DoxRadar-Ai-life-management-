import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';

import Loader from '../components/Loader';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const [activeModal, setActiveModal] = useState(null);

    const value = {
        signUp: (data) => supabase.auth.signUp(data),
        signIn: (data) => supabase.auth.signInWithPassword(data),
        signOut: () => supabase.auth.signOut(),
        user,
        session,
        loading,
        activeModal,
        setGlobalModal: setActiveModal
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? <Loader fullScreen={true} text="Authenticating..." /> : children}
        </AuthContext.Provider>
    );
};
