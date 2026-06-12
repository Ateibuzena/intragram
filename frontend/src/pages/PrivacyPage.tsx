import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
	<section className="mb-8">
		<h2 className="text-base font-bold text-ft-cyan mb-3 uppercase tracking-wide">{title}</h2>
		<div className="space-y-2 text-sm text-ft-muted leading-relaxed">{children}</div>
	</section>
);

const PrivacyPage = () => (
	<div className="min-h-screen bg-ft-bg text-ft-text px-4 py-10">
		<div className="max-w-2xl mx-auto">
			<div className="mb-8">
				<Link to={ROUTES.LOGIN} className="text-xs text-ft-muted hover:text-ft-cyan transition-colors">
					← Volver al inicio
				</Link>
			</div>

			<h1 className="text-2xl font-black text-white mb-1">Política de Privacidad</h1>
			<p className="text-xs text-ft-muted mb-8">Última actualización: junio de 2026</p>

			<div className="bg-ft-card border border-ft-border rounded-2xl p-6 space-y-0">
				<Section title="1. Quiénes somos">
					<p>
						Intragram es una red social desarrollada como proyecto académico del currículo de 42 Network por un
						equipo de estudiantes. La aplicación está destinada exclusivamente a miembros de la comunidad 42 y no
						tiene finalidad comercial.
					</p>
					<p>
						Contacto: los responsables del proyecto son accesibles a través de los canales internos de 42 o
						mediante el repositorio público del proyecto.
					</p>
				</Section>

				<Section title="2. Datos que recopilamos">
					<p>Al iniciar sesión con tu cuenta de 42, recibimos y almacenamos:</p>
					<ul className="list-disc list-inside space-y-1 pl-2">
						<li>Login, nombre, apellidos y nombre visible de 42.</li>
						<li>Correo electrónico asociado a tu cuenta de 42.</li>
						<li>Foto de perfil (URL pública proporcionada por 42).</li>
						<li>Campus, puntos de corrección, wallet y nivel de cursus.</li>
						<li>Datos de proyectos, skills y títulos del cursus 42.</li>
					</ul>
					<p>Además, la aplicación almacena el contenido que tú generas:</p>
					<ul className="list-disc list-inside space-y-1 pl-2">
						<li>Publicaciones del feed que creas voluntariamente.</li>
						<li>Relaciones de amistad que estableces con otros usuarios.</li>
						<li>Mensajes privados 1:1 que envías a través del chat.</li>
						<li>Publicaciones que guardas como favoritas.</li>
					</ul>
				</Section>

				<Section title="3. Cómo usamos tus datos">
					<p>Los datos recopilados se usan exclusivamente para:</p>
					<ul className="list-disc list-inside space-y-1 pl-2">
						<li>Mostrar tu perfil y el de otros usuarios dentro de la aplicación.</li>
						<li>Permitir el funcionamiento del feed social, el chat y las amistades.</li>
						<li>Autenticarte de forma segura mediante JWT.</li>
						<li>Monitorizar el rendimiento técnico de la plataforma (métricas anonimizadas).</li>
					</ul>
					<p>
						No vendemos, cedemos ni compartimos tus datos personales con terceros. Los datos no se usan con fines
						publicitarios ni de perfilado comercial.
					</p>
				</Section>

				<Section title="4. Almacenamiento y seguridad">
					<p>
						Los datos se almacenan en bases de datos PostgreSQL que corren en contenedores Docker bajo el control
						del equipo de desarrollo. El acceso a la aplicación está protegido por HTTPS. Las contraseñas no se
						almacenan: la autenticación se delega completamente a OAuth 42.
					</p>
					<p>
						Al tratarse de un proyecto académico, no podemos garantizar niveles de seguridad equivalentes a los de
						un servicio de producción. Recomendamos no compartir información sensible a través de esta plataforma.
					</p>
				</Section>

				<Section title="5. Retención de datos">
					<p>
						Tus datos permanecen almacenados mientras el proyecto esté activo. Una vez finalizado el ciclo
						académico, los datos serán eliminados junto con la infraestructura del proyecto.
					</p>
					<p>
						Si deseas que tus datos sean eliminados antes, puedes solicitarlo a través de los canales de contacto
						del equipo. Gestionaremos tu solicitud en un plazo razonable.
					</p>
				</Section>

				<Section title="6. Derechos del usuario">
					<p>Como usuario tienes derecho a:</p>
					<ul className="list-disc list-inside space-y-1 pl-2">
						<li>Acceder a los datos que tenemos sobre ti.</li>
						<li>Solicitar la rectificación de datos incorrectos.</li>
						<li>Solicitar la eliminación de tus datos personales.</li>
						<li>Oponerte al tratamiento de tus datos.</li>
					</ul>
					<p>Para ejercer cualquiera de estos derechos, contacta con el equipo del proyecto.</p>
				</Section>

				<Section title="7. Cookies y almacenamiento local">
					<p>
						Intragram no usa cookies de seguimiento. Utiliza <code className="text-ft-cyan">localStorage</code>{' '}
						del navegador únicamente para mantener tu sesión activa (token JWT y datos básicos de usuario). Esta
						información permanece en tu dispositivo y se elimina al cerrar sesión.
					</p>
				</Section>

				<Section title="8. Cambios en esta política">
					<p>
						Esta política puede actualizarse si el proyecto incorpora nuevas funcionalidades. Los cambios
						relevantes serán comunicados a través del repositorio del proyecto.
					</p>
				</Section>
			</div>

			<div className="mt-6 flex gap-4 text-xs text-ft-muted justify-center">
				<Link to={ROUTES.TERMS} className="hover:text-ft-cyan transition-colors">Términos de Servicio</Link>
				<span>·</span>
				<Link to={ROUTES.LOGIN} className="hover:text-ft-cyan transition-colors">Inicio</Link>
			</div>
		</div>
	</div>
);

export default PrivacyPage;
