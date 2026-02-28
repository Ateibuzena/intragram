# NGINX Reverse Proxy

Servicio NGINX configurado como reverse proxy con SSL/TLS para el proyecto Intragram.

## 📋 Descripción

NGINX actúa como punto de entrada único para todas las peticiones HTTP/HTTPS del proyecto, enrutando el tráfico entre el frontend y el API Gateway. Proporciona terminación SSL/TLS, balanceo de carga y soporte para WebSockets.

## 🏗️ Arquitectura

```
Cliente (Browser)
    ↓ HTTPS (443)
┌─────────────────┐
│  NGINX Proxy    │
└─────────────────┘
    ↓           ↓
Frontend     Gateway
(5173)       (3000)
```

## 📦 Componentes

### Dockerfile
- **Base Image**: `nginx:1.25-alpine`
- **SSL/TLS**: Certificado self-signed generado automáticamente
- **Puerto**: 443 (HTTPS)

**Características**:
- Generación automática de certificados SSL
- Configuración optimizada para desarrollo
- Imagen ligera basada en Alpine Linux

### nginx.conf

Archivo de configuración principal que define:

#### 1. **Upstream Servers**
```nginx
upstream gateway {
    server gateway:3000;
}

upstream frontend {
    server frontend:5173;
}
```

#### 2. **SSL/TLS Configuration**
- Certificados: `/etc/nginx/ssl/nginx.crt` y `/etc/nginx/ssl/nginx.key`
- Protocolos: TLSv1.2, TLSv1.3
- Puerto: 443

#### 3. **Routing**

| Path | Destino | Descripción |
|------|---------|-------------|
| `/` | Frontend (5173) | Aplicación web principal |
| `/api/*` | Gateway (3000) | API REST del backend |

#### 4. **WebSocket Support**
Ambos endpoints (`/` y `/api/`) tienen soporte completo para WebSockets mediante:
```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

#### 5. **Headers**
Headers de proxy configurados para ambas rutas:
- `Host`
- `X-Real-IP`
- `X-Forwarded-For`
- `X-Forwarded-Proto`

## 🚀 Uso

### Desarrollo

El servicio se levanta automáticamente con docker-compose:

```bash
docker-compose up nginx
```

### Acceso
- **HTTPS**: https://localhost:443
- **API**: https://localhost/api/

### Verificar configuración
```bash
docker exec nginx nginx -t
```

### Ver logs
```bash
docker logs nginx -f
```

## 🔒 SSL/TLS

### Certificados Self-Signed

Los certificados SSL se generan automáticamente al construir la imagen Docker:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/nginx.key \
  -out /etc/nginx/ssl/nginx.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

### Producción

Para producción, reemplaza los certificados self-signed con certificados reales:

1. **Usando Let's Encrypt**:
```yaml
# docker-compose.yml
volumes:
  - ./certs/fullchain.pem:/etc/nginx/ssl/nginx.crt:ro
  - ./certs/privkey.pem:/etc/nginx/ssl/nginx.key:ro
```

2. **Actualizar nginx.conf** con las rutas correctas si es necesario.

## 🔧 Configuración

### Variables de Entorno

No requiere variables de entorno específicas. La configuración se realiza a través de:
- `nginx.conf` (rutas y upstream servers)
- Certificados SSL montados como volúmenes

### Volúmenes

```yaml
volumes:
  - ./backend/nginx/config/nginx.conf:/etc/nginx/nginx.conf:ro
```

## 📁 Estructura de Archivos

```
backend/nginx/
├── Dockerfile              # Construcción de imagen con SSL
├── NGINX.md               # Documentación (este archivo)
└── config/
    └── nginx.conf         # Configuración principal
```

## 🛠️ Troubleshooting

### Error: Certificate verification failed
- **Causa**: Navegador no confía en certificado self-signed
- **Solución**: En desarrollo, aceptar la advertencia del navegador

### Error: 502 Bad Gateway
- **Causa**: Gateway o Frontend no están accesibles
- **Solución**: Verificar que los servicios estén corriendo:
```bash
docker-compose ps
```

### Error: Connection refused
- **Causa**: Puerto 443 ocupado o contenedor no iniciado
- **Solución**: Verificar puerto disponible:
```bash
netstat -an | grep 443
docker-compose logs nginx
```

## 📝 Notas

- Los certificados self-signed son **solo para desarrollo**
- En producción, usar certificados válidos (Let's Encrypt, etc.)
- WebSocket support habilitado por defecto
- La configuración está simplificada para cumplir requisitos básicos de ft_transcendence

## 🔗 Referencias

- [NGINX Documentation](https://nginx.org/en/docs/)
- [SSL/TLS Best Practices](https://wiki.mozilla.org/Security/Server_Side_TLS)
- [Docker NGINX](https://hub.docker.com/_/nginx)
