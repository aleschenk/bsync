# Autenticación JWT - BSync Server

## Descripción

El servidor BSync ahora incluye autenticación basada en JWT (JSON Web Tokens) para proteger los endpoints de la API.

## Endpoints de Autenticación

### 1. Login
**POST** `/auth/login`

Autentica un usuario y retorna un JWT token.

**Request Body:**
```json
{
  "account_id": "user123",
  "user_id": "user456"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2024-01-21T19:30:45Z",
  "account_id": "user123",
  "user_id": "user456"
}
```

### 2. Refresh Token
**POST** `/auth/refresh`

Refresca un JWT token existente.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2024-01-21T19:30:45Z",
  "account_id": "user123",
  "user_id": "user456"
}
```

## Endpoints Protegidos

Todos los endpoints de la API (excepto `/health` y `/auth/*`) ahora requieren autenticación JWT.

### Headers Requeridos
```
Authorization: Bearer <token>
```

### Endpoints Protegidos:
- `POST /accounts` - Crear cuenta
- `POST /accounts/{accountId}/sessions/{sessionId}` - Guardar sesión
- `GET /accounts/{accountId}/sessions` - Obtener todas las sesiones
- `GET /accounts/{accountId}/sessions/{sessionId}` - Obtener sesión específica

## Configuración

### Variables de Entorno

- `JWT_SECRET`: Clave secreta para firmar los tokens JWT (requerida en producción)
- `GIN_MODE`: Modo de Gin (release para producción)

### Ejemplo de Configuración

```bash
export JWT_SECRET="tu-clave-secreta-muy-segura"
export GIN_MODE="release"
```

## Uso con cURL

### 1. Hacer Login
```bash
curl -X POST http://localhost:2544/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account_id": "user123", "user_id": "user456"}'
```

### 2. Usar el Token
```bash
# Guardar el token de la respuesta anterior
TOKEN=""

# Usar el token en requests protegidos
curl -X GET http://localhost:2544/accounts/user123/sessions \
  -H "Authorization: Bearer $TOKEN"
```

## Seguridad

### Características de Seguridad Implementadas:

1. **Autenticación JWT**: Tokens firmados con HMAC-SHA256
2. **Expiración de Tokens**: Tokens expiran en 24 horas por defecto
3. **Autorización por Recurso**: Los usuarios solo pueden acceder a sus propias cuentas
4. **Validación de Claims**: Verificación de account_id en el path vs token
5. **Headers de Seguridad**: Validación estricta del formato Authorization

### Recomendaciones de Producción:

1. **Cambiar JWT_SECRET**: Usar una clave secreta fuerte y única
2. **HTTPS**: Usar HTTPS en producción para proteger los tokens
3. **Rotación de Secretos**: Implementar rotación periódica de JWT_SECRET
4. **Monitoreo**: Monitorear intentos de acceso no autorizados
5. **Rate Limiting**: Implementar límites de velocidad para prevenir ataques

## Desarrollo

### Estructura de Archivos:
```
server/
├── auth/
│   ├── jwt.go          # Funciones utilitarias JWT
│   ├── middleware.go   # Middleware de autenticación
│   └── handlers.go     # Handlers de login/refresh
├── storage/
└── server.go          # Servidor principal con rutas protegidas
```

### Testing

Para probar la autenticación:

1. Iniciar el servidor
2. Hacer login para obtener un token
3. Usar el token en requests protegidos
4. Verificar que requests sin token son rechazados

## Swagger Documentation

La documentación Swagger incluye información sobre autenticación:
- Accede a `/swagger/index.html` para ver la documentación completa
- Los endpoints protegidos muestran el ícono de candado
- Incluye ejemplos de uso con tokens JWT
