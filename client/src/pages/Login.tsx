import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useLocation } from 'wouter';
import ErrorBoundary from '@/components/ErrorBoundary';

const providers = [
	{
		name: 'Apple',
		id: 'apple',
		color: 'bg-black text-white hover:bg-gray-900',
		icon: (
			<svg
				className="w-5 h-5 mr-2"
				viewBox="0 0 24 24"
				fill="currentColor"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path d="M16.365 1.43c0 1.14-.415 2.054-1.245 2.743-.835.692-1.775 1.104-2.82 1.236a1.96 1.96 0 0 1-.184-.808c0-1.04.413-1.963 1.24-2.768.83-.804 1.768-1.21 2.81-1.22.02.273.03.53.03.783z" />
				<path d="M20.652 16.598c-.156.363-.316.698-.48 1.006a9.268 9.268 0 0 1-.654 1.055 6.385 6.385 0 0 1-.823.982c-.274.293-.56.545-.855.757-.29.204-.59.383-.9.537a4.567 4.567 0 0 1-1.142.361 5.505 5.505 0 0 1-1.172.123c-.367 0-.743-.04-1.127-.12a4.5 4.5 0 0 1-1.16-.375c-.325-.152-.64-.33-.946-.537-.307-.21-.606-.457-.9-.74a6.847 6.847 0 0 1-1.17-1.48c-.296-.46-.546-.91-.75-1.35a12.794 12.794 0 0 1-.615-1.402 11.373 11.373 0 0 1-.51-1.502 6.093 6.093 0 0 1-.218-1.388c0-.491.092-.96.276-1.41.18-.445.428-.848.745-1.21a2.69 2.69 0 0 1 1.064-.753c.408-.15.855-.206 1.343-.168.481.038.93.18 1.343.426.414.25.748.543 1.005.878.263.33.509.723.745 1.182.107.207.198.412.276.614.078.202.144.37.196.502.063.173.13.347.202.52.073.173.14.343.202.51.045.113.105.258.18.432a6.198 6.198 0 0 1 .276-.485 4.83 4.83 0 0 1 .4-.53c.15-.183.35-.368.6-.553.25-.186.52-.336.81-.45.295-.12.606-.187.933-.2a3.39 3.39 0 0 1 1.37.3c.443.207.81.536 1.1.99.13.19.258.41.384.655.126.245.234.505.323.78.09.277.16.536.21.78.052.245.078.49.078.735a5.256 5.256 0 0 1-.33 1.44z" />
			</svg>
		),

	},

	{
		name: 'Google',
		id: 'google',
		color: 'bg-white text-[#000000] hover:bg-gray-100 border border-gray-300',
		icon: (
			<svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
				<g>
					<path
						fill="#4285F4"
						d="M24 9.5c3.54 0 6.36 1.53 7.82 2.81l5.77-5.77C34.64 3.36 29.82 1 24 1 14.61 1 6.44 6.99 2.69 15.09l6.91 5.36C11.36 14.36 17.14 9.5 24 9.5z"
					/>
					<path
						fill="#34A853"
						d="M46.1 24.5c0-1.64-.15-3.22-.43-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.6C43.56 37.01 46.1 31.23 46.1 24.5z"
					/>
					<path
						fill="#FBBC05"
						d="M9.6 28.59c-1.13-3.36-1.13-6.82 0-10.18l-6.91-5.36C.99 17.61 0 20.71 0 24s.99 6.39 2.69 10.09l6.91-5.36z"
					/>
					<path
						fill="#EA4335"
						d="M24 46.5c5.82 0 10.64-1.92 14.19-5.24l-7.19-5.6c-2.01 1.35-4.59 2.14-7 2.14-6.86 0-12.64-4.86-14.4-11.36l-6.91 5.36C6.44 41.01 14.61 46.5 24 46.5z"
					/>
				</g>
			</svg>
		),
	},
];

const LoginPage: React.FC = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [, navigate] = useLocation();

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		setSuccess(false);

		const { data, error } = await supabase.auth.signInWithPassword({ email, password });

		if (error) {
			setError(error.message);
		} else if (data.session) {
			// Store the token in localStorage
			localStorage.setItem('authToken', data.session.access_token);

			// Optionally store the refresh token
			localStorage.setItem('refreshToken', data.session.refresh_token);

			setSuccess(true);
			navigate('/dashboard');
		}

		setLoading(false);
	};

	const handleOAuth = async (provider: 'google' | 'apple') => {
		setLoading(true);
		setError(null);
		setSuccess(false);

		const { error } = await supabase.auth.signInWithOAuth({
			provider,
			options: {
				redirectTo: `${window.location.origin}/dashboard`
			}
		});

		if (error) {
			setError(error.message);
			setLoading(false);
		}
		// No need to handle session here; user will be redirected by Supabase.
	};

	return (
		<div className="min-h-screen flex flex-col bg-gradient-to-r from-bigGrinch to-littleGrinch">
			<div className="flex flex-1 items-center justify-center">
				<div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md mx-4">
					<div className="flex flex-col items-center mb-6">
						<img src="/appicon-rounded.png" alt="WeBudget Logo" className="w-16 h-16 mb-2" />
						<p className="text-gray-600">Welcome to WeBudget. Please sign in to continue.</p>
					</div>
					<form onSubmit={handleLogin} className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
							<input
								type="email"
								placeholder="yourname@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
								required
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
							<input
								type="password"
								placeholder="Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
								required
							/>
						</div>
						{error && <div className="text-red-600 text-sm text-center">{error}</div>}
						{success && <div className="text-green-600 text-sm text-center">Login successful!</div>}
						<button
							type="submit"
							className="w-full py-2 px-4 bg-gradient-to-r from-bigGrinch to-littleGrinch text-white rounded-lg font-semibold hover:bg-blue-700 transition"
							disabled={loading}
						>
							{loading ? 'Signing in...' : 'Sign In'}
						</button>
					</form>
					<div className="my-6 flex items-center justify-center">
						<span className="h-px w-16 bg-gray-200" />
						<span className="mx-4 text-gray-400 text-sm">or continue with</span>
						<span className="h-px w-16 bg-gray-200" />
					</div>
					<div className="flex flex-col gap-2">
						{providers.map((p) => (
							<button
								key={p.id}
								onClick={() => handleOAuth(p.id as 'google' | 'apple')}
								className={`flex items-center justify-center w-full py-2 px-4 ${p.color} rounded-lg font-semibold hover:opacity-90 transition`}
								disabled={loading}
							>
								{p.icon}Continue with {p.name}
							</button>
						))}
					</div>

					{/* ✅ Sign Up Section */}
					<div className="mt-6 text-center text-sm text-gray-600">
						Don't have an account?{' '}
						<a href="/signup" className="text-blue-600 hover:underline font-medium">
							Sign Up
						</a>
					</div>
				</div>
			</div>
			<div className="py-6 text-white text-xs text-center">
				&copy; {new Date().getFullYear()} WeBudget. All rights reserved.
			</div>
		</div>
	);
};

// Wrap the LoginPage component with ErrorBoundary
export default function LoginPageWithBoundary() {
	return (
		<ErrorBoundary>
			<LoginPage />
		</ErrorBoundary>
	);
}
