# SIGEBO — Sistema de Gestión de Estaciones de Bomberos

Aplicación web para la gestión integral de un parque de bomberos: personal,
guardias, turnos de refuerzo, emergencias, vehículos, formación, méritos,
carnets, permisos y avisos. Cada bombero dispone de un **área personal** con su
información operativa (próximas guardias, formaciones pendientes, estado de
carnets, méritos y permisos).

Proyecto de Trabajo de Fin de Grado del ciclo de **Desarrollo de Aplicaciones
Web (2.º DAW)** del **CPIFP Bajo Aragón** (Alcañiz), grupo SyncFive.

## Stack

- **Backend:** PHP 8.2 (API REST con arquitectura MVC) sobre Apache
- **Base de datos:** MySQL 8
- **Frontend:** JavaScript (vanilla, sin framework), Bootstrap 5
- **Mapas:** Leaflet + OpenStreetMap, geocodificación con Nominatim
- **Correo:** PHPMailer sobre SMTP
- **Entorno:** Docker + Docker Compose
- **Autenticación:** sesiones de servidor de PHP (`password_verify`)

## Estructura

```
api_rest/        Backend PHP (API REST)
  config/        Configuración (config.php no versionado)
  public/        Punto de entrada HTTP
  src/           Código fuente MVC
  storage/       Logs, fotos de perfil, rate limiting
  vendor/        Dependencias de Composer
frontend/        Cliente web
  assets/        Recursos estáticos
  config/        Configuración del cliente
  javascript/    Controladores, API y helpers
  pages/         Vistas HTML por módulo
  includes/      Cabecera, sidebar, footer compartidos
.htaccess        Reescritura de rutas (URLs limpias)
DDL_DML_SIGEBO.sql        Esquema + datos base + datos de demo (init de la BD)
docker-compose.yml        Servicios apache + mysql
Dockerfile                Imagen PHP 8.2 + Apache
```

## Requisitos

- Docker y Docker Compose
- Composer (para instalar dependencias PHP, si no se usa la imagen ya construida)

## Puesta en marcha (Docker)

1. Copia `.env.example` a `.env` y rellena las variables (credenciales de BD,
   SMTP y `APP_URL`):

   ```bash
   cp .env.example .env
   ```

2. Levanta los servicios:

   ```bash
   docker compose up -d --build
   ```

   - Apache queda disponible en **http://localhost:8081**
   - MySQL se expone en el puerto **3307** del host
   - `DDL_DML_SIGEBO.sql` se carga automáticamente como inicialización de la BD
     e incluye el esquema, los datos base y los datos de demostración de junio
     2026 (todo en un único script)

## Variables de entorno

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `DB_NAME` | Nombre de la base de datos | `prueba` |
| `DB_USER` / `DB_PASS` | Credenciales de MySQL | — |
| `MYSQL_ROOT_PASSWORD` | Contraseña de root de MySQL | — |
| `MAIL_HOST` / `MAIL_PORT` | Servidor SMTP | `smtp.example.com` / `465` |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | Credenciales SMTP | — |
| `MAIL_ENCRYPTION` | Cifrado SMTP | `ssl` |
| `MAIL_FROM_EMAIL` / `MAIL_FROM_NAME` | Remitente de los correos | `SIGEBO` |
| `APP_URL` | URL base para los enlaces de correo | `http://localhost:8081` |

## Roles

El sistema define cinco roles con distintos niveles de acceso:

1. **BOMBERO**
2. **OFICIAL**
3. **JEFE DE INTERVENCIÓN**
4. **JEFE DE MANDO**
5. **INSPECTOR**
