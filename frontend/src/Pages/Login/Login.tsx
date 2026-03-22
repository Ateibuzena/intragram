import { useEffect, useState } from 'react';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type AuthSession = {
    access_token: string;
    user: {
        id: string;
        username: string;
        email: string;
        display_name: string | null;
    };
};

export default function Login() {

    const router = useNavigate();
    const location = useLocation();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        display_name: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const user = params.get('user');

        if (!token || !user) {
            return;
        }

        try {
            const parsedUser = JSON.parse(user);

            localStorage.setItem('intragram.auth', JSON.stringify({
                access_token: token,
                user: parsedUser,
            }));

            router('/chat', { replace: true });
        } catch (error) {
            console.error('Error al procesar el callback OAuth:', error);
        }
    }, [location.search, router]);

    const handleRegister = async () => {
        console.log("Datos de registro:", formData);

        try {

            const registerRes = await fetch('https://localhost:8443/api/auth/register', {
                method: 'POST',
                body: JSON.stringify(formData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const registerData = (await registerRes.json()) as AuthSession;
            console.log("Usuario registrado:", registerData);

            if (!registerData.access_token || !registerData.user?.id) {
                throw new Error('Respuesta de autenticación inválida');
            }

            localStorage.setItem('intragram.auth', JSON.stringify(registerData));
            router("/chat"); // el registro real se hace por evento websocket

        } catch (error) {
            console.error("Error during registration:", error);
            alert("Error al registrar el usuario. Revisa la consola para más detalles.");
            return;
        }

    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            background: 'radial-gradient(circle at top, #1f2a44 0%, #0b1020 45%, #050816 100%)',
            color: '#e5eefc',
            fontFamily: 'Inter, system-ui, sans-serif',
        }}>
            <div style={{
                width: 'min(520px, 92vw)',
                padding: '32px',
                borderRadius: '24px',
                background: 'rgba(10, 15, 30, 0.72)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
                boxShadow: '0 24px 80px rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(18px)',
            }}>
                <div style={{ marginBottom: '24px' }}>
                    <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.24em', fontSize: '12px', color: '#7dd3fc' }}>Intragram</p>
                    <h1 style={{ margin: '10px 0 8px', fontSize: '40px', lineHeight: 1.05 }}>Crear cuenta y entrar al chat</h1>
                    <p style={{ margin: 0, color: '#9fb0d0', lineHeight: 1.5 }}>Registra un usuario, guardamos el access token y pasas directo al chat protegido.</p>
                </div>

                {/* Formulario de registro */}
                <div style={{ marginBottom: '16px' }}>
                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleChange}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            border: '1px solid #6b7c99',
                            marginBottom: '10px',
                            fontSize: '14px',
                            color: '#e5eefc',
                            background: '#1c2533',
                            outline: 'none',
                        }}
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            border: '1px solid #6b7c99',
                            marginBottom: '10px',
                            fontSize: '14px',
                            color: '#e5eefc',
                            background: '#1c2533',
                            outline: 'none',
                        }}
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            border: '1px solid #6b7c99',
                            marginBottom: '10px',
                            fontSize: '14px',
                            color: '#e5eefc',
                            background: '#1c2533',
                            outline: 'none',
                        }}
                    />
                    <input
                        type="text"
                        name="display_name"
                        placeholder="Display Name"
                        value={formData.display_name}
                        onChange={handleChange}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            border: '1px solid #6b7c99',
                            marginBottom: '20px',
                            fontSize: '14px',
                            color: '#e5eefc',
                            background: '#1c2533',
                            outline: 'none',
                        }}
                    />
                </div>

                {/* Botón de registro */}
                <button
                    onClick={handleRegister}
                    style={{
                        width: '100%',
                        border: 'none',
                        borderRadius: '14px',
                        padding: '16px 20px',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#08111f',
                        background: 'linear-gradient(135deg, #7dd3fc 0%, #a78bfa 100%)',
                        cursor: 'pointer',
                        boxShadow: '0 12px 40px rgba(125, 211, 252, 0.24)',
                    }}
                >
                    Registrar y entrar
                </button>
            </div>
        </div>
    );
}