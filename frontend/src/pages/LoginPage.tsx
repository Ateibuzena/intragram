const LoginPage = () => (
	<div className="min-h-screen bg-ft-bg flex flex-col items-center justify-center px-4">
		<div className="w-full max-w-sm">
			<div className="text-center mb-8">
				<img
					src="/logo.png"
					alt="logo"
					className="mx-auto mb-4 w-70 h-48"
				/>

				<h1 className="text-4xl font-black text-ft-cyan mb-2">
					Intra<span className="text-white">gram</span>
				</h1>
				<p className="text-ft-muted text-sm">
					La red social de la comunidad 42
				</p>
			</div>
			<div className="surface-glass border border-ft-border rounded-2xl p-6">
				<a
					href="/api/auth/42"
					className="flex items-center justify-center gap-3 w-full bg-ft-cyan hover:bg-ft-cyan-light text-black font-bold py-3 rounded-xl transition-all duration-200 hover:shadow-ft-glow active:scale-[0.98]"
				>
					Entrar con 42
				</a>
				<p className="text-xs text-ft-muted text-center mt-4">
					Solo para estudiantes de la red 42
				</p>
			</div>
			<p className="text-[11px] text-ft-muted text-center mt-6 space-x-2">
				<a href="/privacy" className="hover:text-ft-cyan transition-colors">Política de Privacidad</a>
				<span>·</span>
				<a href="/terms" className="hover:text-ft-cyan transition-colors">Términos de Servicio</a>
			</p>
		</div>
	</div>
);

export default LoginPage;
