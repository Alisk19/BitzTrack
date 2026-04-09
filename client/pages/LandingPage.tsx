import React, { useState, useEffect } from 'react';
import { BackgroundPaths } from "@/components/ui/background-paths";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogIn, Eye, EyeOff } from 'lucide-react';

const LandingPage: React.FC = () => {
    const location = useLocation();
    const [showLogin, setShowLogin] = useState(location.state?.showLogin || false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const words = "BE Endless".split(" ");

    useEffect(() => {
        if (location.state?.showLogin) {
            setShowLogin(true);
        }
    }, [location.state]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setSuccess(true);
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
        } catch (err: any) {
            setError(err.message || 'Failed to sign in. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full relative min-h-screen overflow-hidden">
            <BackgroundPaths>
                <div className="w-full flex justify-center items-center min-h-[80vh] relative z-10">
                    <AnimatePresence mode="wait">
                        {!showLogin && !success ? (
                            <motion.div
                                key="hero"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, y: -50, filter: "blur(10px)", scale: 0.9 }}
                                transition={{ duration: 0.6, ease: "easeInOut" }}
                                className="max-w-4xl mx-auto text-center"
                            >
                                <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold mb-12 tracking-tighter group cursor-default">
                                    {words.map((word, wordIndex) => (
                                        <span
                                            key={wordIndex}
                                            className="inline-block mr-4 last:mr-0"
                                        >
                                            {word.split("").map((letter, letterIndex) => (
                                                <motion.span
                                                    key={`${wordIndex}-${letterIndex}`}
                                                    initial={{ y: 100, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    transition={{
                                                        delay: wordIndex * 0.1 + letterIndex * 0.03,
                                                        type: "spring",
                                                        stiffness: 150,
                                                        damping: 25,
                                                    }}
                                                    className={`inline-block text-transparent bg-clip-text transition-all duration-500
                                                    ${word === "BE" || word === "Be"
                                                            ? "bg-gradient-to-r from-primary to-yellow-600 drop-shadow-[0_0_8px_rgba(212,175,55,0.5)] group-hover:drop-shadow-[0_0_25px_rgba(212,175,55,1)]"
                                                            : "bg-gradient-to-r from-gray-200 to-gray-500 group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"}`}
                                                >
                                                    {letter}
                                                </motion.span>
                                            ))}
                                        </span>
                                    ))}
                                </h1>

                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8, duration: 0.8 }}
                                >
                                    <button
                                        onClick={() => setShowLogin(true)}
                                        className="inline-block group relative bg-gradient-to-b from-white/10 to-black/10 
                                        p-px rounded-3xl backdrop-blur-lg 
                                        overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all duration-500"
                                    >
                                        <div
                                            className="flex items-center rounded-[1.4rem] px-10 py-5 text-xl font-bold backdrop-blur-md 
                                            bg-background-surface hover:bg-gradient-to-r hover:from-[#1a1a1a] hover:to-[#2a2a2a] hover:text-primary
                                            text-foreground transition-all duration-300 
                                            group-hover:-translate-y-0.5 border border-glass-border
                                            hover:border-primary/50"
                                        >
                                            <span className="opacity-90 group-hover:opacity-100 transition-opacity tracking-wide">
                                                Dare to Start
                                            </span>
                                            <span
                                                className="ml-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-2 
                                                transition-all duration-300 text-primary"
                                            >
                                                →
                                            </span>
                                        </div>
                                    </button>
                                </motion.div>
                            </motion.div>
                        ) : success ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full max-w-md relative z-10 flex flex-col items-center justify-center p-12"
                            >
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                    className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-black mb-6 shadow-[0_0_40px_rgba(212,175,55,0.6)]"
                                >
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                </motion.div>
                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-3xl font-bold text-foreground tracking-tight text-center"
                                >
                                    Welcome to BE Endless
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="text-primary mt-2 animate-pulse"
                                >
                                    Entering dashboard...
                                </motion.p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="login"
                                initial={{ opacity: 0, y: 60, filter: "blur(20px)", scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
                                exit={{ opacity: 0, y: -40, filter: "blur(20px)", scale: 0.95 }}
                                transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                                className="w-full max-w-md relative z-10"
                            >
                                <div className="text-center mb-10">
                                    <motion.img
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        src="/navbar-logo.png"
                                        alt="BE ENDLESS"
                                        className="h-16 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]"
                                    />
                                    <h2 className="text-3xl font-bold text-foreground tracking-tight">Welcome Back</h2>
                                    <p className="text-muted mt-2">Sign in to access your dashboard</p>
                                </div>

                                <motion.div
                                    className="glass-panel p-8 rounded-3xl border border-glass-border shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl bg-background-base/60 relative overflow-hidden group"
                                    whileHover={{ boxShadow: "0 0 50px rgba(212,175,55,0.15)" }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <form onSubmit={handleLogin} className="space-y-6">
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10, height: 0 }}
                                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                                className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm text-center"
                                            >
                                                {error}
                                            </motion.div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-muted uppercase tracking-wider ml-1">Email Address</label>
                                            <Input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="name@example.com"
                                                className="bg-glass-input border-glass-border text-black placeholder:text-gray-400 focus-visible:ring-primary/50 focus-visible:border-primary/50 h-12 rounded-xl transition-all"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2 relative">
                                            <label className="text-xs font-semibold text-muted uppercase tracking-wider ml-1">Password</label>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="bg-glass-input border-glass-border text-black placeholder:text-gray-400 focus-visible:ring-primary/50 focus-visible:border-primary/50 h-12 rounded-xl transition-all pr-12"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted hover:text-primary transition-colors"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                </button>
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full h-12 bg-primary hover:bg-yellow-500 text-black font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] transition-all overflow-hidden relative"
                                        >
                                            {loading ? (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="flex items-center"
                                                >
                                                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                                                    Authenticating...
                                                </motion.div>
                                            ) : (
                                                <span className="flex items-center justify-center relative z-10 w-full">
                                                    Sign In
                                                    <LogIn className="w-5 h-5 ml-2 opacity-80" />
                                                </span>
                                            )}
                                        </Button>
                                    </form>

                                </motion.div>
                                <div className="mt-8 text-center">
                                    <button
                                        onClick={() => setShowLogin(false)}
                                        className="text-sm font-medium text-muted hover:text-foreground flex items-center justify-center mx-auto transition-colors px-4 py-2 rounded-full hover:bg-glass-input"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                        Back to Home
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </BackgroundPaths>
        </div>
    );
};

export default LandingPage;
