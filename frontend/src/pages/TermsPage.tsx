import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
	<section className="mb-8">
		<h2 className="text-base font-bold text-ft-cyan mb-3 uppercase tracking-wide">{title}</h2>
		<div className="space-y-2 text-sm text-ft-muted leading-relaxed">{children}</div>
	</section>
);

const TermsPage = () => (
	<div className="min-h-screen bg-ft-bg text-ft-text px-4 py-10">
		<div className="max-w-2xl mx-auto">
			<div className="mb-8">
				<Link to={ROUTES.LOGIN} className="text-xs text-ft-muted hover:text-ft-cyan transition-colors">
					← Volver al inicio
				</Link>
			</div>

			<h1 className="text-2xl font-black text-white mb-1">Términos de Servicio</h1>
			<p className="text-xs text-ft-muted mb-8">Última actualización: junio de 2026</p>

			<div className="bg-ft-card border border-ft-border rounded-2xl p-6 space-y-0">
				<Section title="1. Aceptación de los términos">
					<p>
						Al acceder y usar Intragram, aceptas estos Términos de Servicio. Si no estás de acuerdo con alguno de
						los puntos, no debes usar la aplicación.
					</p>
					<p>
						Intragram es un proyecto académico desarrollado dentro del currículo de 42 Network. No es un servicio
						comercial.
					</p>
				</Section>

				<Section title="2. Elegibilidad">
					<p>
						El acceso a Intragram está restringido a personas con una cuenta activa en la red 42. La autenticación
						se realiza exclusivamente mediante OAuth 42. No se admiten registros externos.
					</p>
					<p>
						Al usar la aplicación confirmas que eres estudiante, staff o alumni de 42 y que tu cuenta de 42 está
						en regla.
					</p>
				</Section>

				<Section title="3. Uso aceptable">
					<p>Te comprometes a usar Intragram de forma responsable. Está prohibido:</p>
					<ul className="list-disc list-inside space-y-1 pl-2">
						<li>Publicar contenido ofensivo, discriminatorio, violento o ilegal.</li>
						<li>Acosar, intimidar o amenazar a otros usuarios.</li>
						<li>Intentar acceder a cuentas o datos de otros usuarios sin autorización.</li>
						<li>Realizar ataques o pruebas de penetración sobre la infraestructura sin permiso explícito.</li>
						<li>Usar la aplicación para actividades contrarias al código de conducta de 42.</li>
						<li>Publicar spam, contenido duplicado masivo o publicidad no autorizada.</li>
					</ul>
				</Section>

				<Section title="4. Contenido del usuario">
					<p>
						Eres responsable de todo el contenido que publicas en Intragram (posts, mensajes, datos de perfil).
						Al publicar contenido, garantizas que tienes derecho a hacerlo y que no infringe derechos de terceros.
					</p>
					<p>
						El equipo de desarrollo se reserva el derecho de eliminar contenido que incumpla estos términos,
						aunque no tiene obligación de monitorizar activamente el contenido publicado.
					</p>
				</Section>

				<Section title="5. Disponibilidad del servicio">
					<p>
						Intragram se proporciona «tal cual» sin garantías de disponibilidad continua. Al ser un proyecto
						académico, puede estar sujeto a interrupciones, mantenimiento o retirada del servicio sin previo
						aviso.
					</p>
					<p>
						El equipo de desarrollo no se hace responsable de pérdidas de datos, interrupciones del servicio ni
						daños derivados del uso o la imposibilidad de uso de la aplicación.
					</p>
				</Section>

				<Section title="6. Privacidad">
					<p>
						El tratamiento de tus datos personales se rige por nuestra{' '}
						<Link to={ROUTES.PRIVACY} className="text-ft-cyan hover:underline">
							Política de Privacidad
						</Link>
						, que forma parte integral de estos términos.
					</p>
				</Section>

				<Section title="7. Propiedad intelectual">
					<p>
						El código fuente de Intragram es propiedad del equipo de desarrollo y está disponible en el
						repositorio del proyecto bajo los términos de licencia que allí se especifiquen.
					</p>
					<p>
						Los logotipos e imágenes de 42 Network son propiedad de 42 y se usan únicamente en el contexto
						académico autorizado.
					</p>
				</Section>

				<Section title="8. Modificaciones">
					<p>
						El equipo de desarrollo puede modificar estos términos en cualquier momento. Los cambios entrarán en
						vigor con su publicación en la aplicación. El uso continuado de Intragram tras la publicación de los
						cambios implica la aceptación de los nuevos términos.
					</p>
				</Section>

				<Section title="9. Finalización del servicio">
					<p>
						El servicio finalizará al concluir el ciclo académico del proyecto. En ese momento todos los datos
						serán eliminados. Los usuarios no tendrán derecho a compensación por el cese del servicio.
					</p>
				</Section>

				<Section title="10. Legislación aplicable">
					<p>
						Estos términos se rigen por la legislación española. Cualquier controversia se someterá a los
						tribunales competentes conforme a dicha legislación.
					</p>
				</Section>
			</div>

			<div className="mt-6 flex gap-4 text-xs text-ft-muted justify-center">
				<Link to={ROUTES.PRIVACY} className="hover:text-ft-cyan transition-colors">Política de Privacidad</Link>
				<span>·</span>
				<Link to={ROUTES.LOGIN} className="hover:text-ft-cyan transition-colors">Inicio</Link>
			</div>
		</div>
	</div>
);

export default TermsPage;
