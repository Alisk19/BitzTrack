import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogIn, Eye, EyeOff } from 'lucide-react';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (email !== 'beendless44@gmail.com') {
            setError('Unauthorized account access.');
            return;
        }

        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to sign in. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-base flex flex-col justify-center items-center p-4">
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl mix-blend-screen opacity-50 animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-900/20 rounded-full blur-3xl mix-blend-screen opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-10">
                    <img src="/navbar-logo.png" alt="BE ENDLESS" className="h-16 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]" />
                    <h2 className="text-3xl font-bold text-foreground tracking-tight">Welcome Back</h2>
                    <p className="text-muted mt-2">Sign in to access your dashboard</p>
                </div>

                <div className="glass-panel p-8 rounded-2xl border border-glass-border shadow-2xl backdrop-blur-xl bg-background-base/40">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground-muted">Email Address</label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="bg-glass-input border-glass-border text-foreground placeholder:text-muted focus-visible:ring-primary/50"
                                required
                            />
                        </div>

                        <div className="space-y-2 relative">
                            <label className="text-sm font-medium text-foreground-muted">Password</label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="bg-glass-input border-glass-border text-foreground placeholder:text-muted focus-visible:ring-primary/50 pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-foreground transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-yellow-600 text-black font-semibold shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all"
                        >
                            {loading ? 'Authenticating...' : (
                                <>
                                    <LogIn className="w-4 h-4 mr-2" />
                                    Sign In
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
