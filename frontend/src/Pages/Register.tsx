import { useNavigate } from 'react-router-dom';
import { useState } from "react";

export default function Register() {

    const router = useNavigate();
    const [users, setUsers] = useState<string[]>([]);
    const [clientId, setClientId] = useState<string>("");
    const [isAuth, setIsAuth] = useState<boolean | null>(null);

    const userData = {
        username: "usuario",
        email: "usuario@example.com",
        password: "Password1@",
        display_name: "Usuario Ejemplo"
    };

    const handleRegister = async () => {
        console.log("Datos de registro:", userData);

        try {

            const registerRes = await fetch('https://localhost:8443/api/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData),
                credentials: 'include', // para enviar cookies si el auth service las usa
                headers: {
                    'Content-Type': 'application/json'
                    },
                });

            const registerData = await registerRes.json();
            console.log("Usuario registrado:", registerData);
            
            if (!registerData.user.id) {
                throw new Error('Token inválido');
            }
            router("/chat"); // el registro real se hace por evento websocket

        } catch (error) {
            console.error("Error during registration:", error);
            alert("Error al registrar el usuario. Revisa la consola para más detalles.");
            return;
        }
       
    };

    return (
        <div>
            {/* boton de enviar mensaje */}
            <button onClick={handleRegister}>Registrar</button>
        </div>
    )
}

// import { useNavigate } from 'react-router-dom';
// import { useState } from "react";

// export default function Register() {
//     const router = useNavigate();

//     const [users, setUsers] = useState<string[]>([]);
// 	const [clientId, setClientId] = useState<string>("");
//     const [isAuth, setIsAuth] = useState<boolean | null>(null);

//     const handleRegister = async () => {

//         const userData = {
//             username: "usuario_123",
//             email: "usuario123@example.com",
//             password: "Password1@",
//             display_name: "Usuario Ejemplo"
//         };
//         console.log("Datos de registro:", userData);

//         try {
//             const validateRes = await fetch('http://localhost:8443/api/auth/validate', {
// 					method: 'POST',
// 					credentials: 'include',
//                     body: JSON.stringify({ access_token: '' }), // el token real se envía en cookies, esto es solo para cumplir con la estructura esperada por el endpoint
//                     headers: {
//                         'Content-Type': 'application/json'
//                     },
//             });
//             const validateData = await validateRes.json();
//             if (validateData.valid) {
//                 alert("Ya estás autenticado. Redirigiendo al chat...");
//                 router("/chat");
//                 return;
//             }
//             else {
//                 setIsAuth(validateData.valid);
//                 const currentUserId = validateData.user.id;
//                 setClientId(currentUserId);
//                 setUsers(validateData.users.filter((u: any) => u !== currentUserId)); // agregar self al listado de usuarios conectados
//             }
            
//             // conectarse a auth service y registrar el cliente, obteniendo un clientId único
//             const registerRes = await fetch('https://localhost:8443/api/auth/register', {
//                 method: 'POST',
//                 body: JSON.stringify(userData),
//                 credentials: 'include', // para enviar cookies si el auth service las usa
//                 headers: {
//                     'Content-Type': 'application/json'
//                     },
//                 });

//             const registerData = await registerRes.json();
//             console.log("Usuario registrado:", registerData);
            
//             if (!registerData.valid) {
//                 throw new Error('Token inválido');
//             }
//             router("/chat"); // el registro real se hace por evento websocket
//         } catch (error) {
//             console.error("Error during registration:", error);
//             alert("Error al registrar el usuario. Revisa la consola para más detalles.");
//         }
//     };

//     return (
//         <div>
//             {/* boton de enviar mensaje */}
//             <button onClick={handleRegister}>Registrar</button>
//         </div>
//     )
// }

