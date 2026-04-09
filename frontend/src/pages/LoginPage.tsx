const LoginPage = () => (
	<div className="min-h-screen bg-ft-bg flex items-center justify-center px-4">
		<div className="w-full max-w-sm">
			<div className="text-center mb-8">
				<h1 className="text-4xl font-black text-ft-cyan mb-2">
					Intra<span className="text-white">gram</span>
				</h1>
				<p className="text-ft-muted text-sm">La red social de la comunidad 42</p>
			</div>
			<div className="bg-ft-card border border-ft-border rounded-2xl p-6">
				<a
					href="/api/auth/42"
					className="flex items-center justify-center gap-3 w-full bg-ft-cyan hover:bg-ft-cyan-light text-black font-bold py-3 rounded-xl transition-all duration-200 hover:shadow-ft-glow active:scale-[0.98]"
				>
					<span className="text-lg">🎓</span>
					Entrar con 42
				</a>
				<p className="text-xs text-ft-muted text-center mt-4">
					Solo para estudiantes de la red 42
				</p>
			</div>
		</div>
	</div>
);

export default LoginPage;
