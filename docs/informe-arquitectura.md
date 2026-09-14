# Informe de arquitectura — Sistema de Agendamiento de Turnos

> Basado en [arc42](https://arc42.org) (plantilla oficial en español, [arc42/arc42-template](https://github.com/arc42/arc42-template)), adaptado a este proyecto. Los bloques citados como este son guía de arc42 o notas de contexto — bórralos a medida que redactes. Los datos técnicos (endpoints, entidades, configuración) ya están rellenados porque son hechos verificables del repo; lo que falta por escribir es principalmente el *porqué* de cada decisión, en tu propia voz.

## 1. Introducción y metas

### 1.1 Vista de requerimientos

Sistema de agendamiento de turnos para una entidad bancaria (prueba técnica Amaris Consulting). Un cliente agenda un turno indicando su cédula y la sucursal donde será atendido, sin necesidad de estar físicamente ahí (web). Reglas de negocio centrales:

- El turno debe activarse dentro de los **15 minutos** siguientes a agendarse; si no, expira automáticamente.
- Una misma cédula no puede solicitar más de **5 turnos en el mismo día**; al llegar al límite queda bloqueada hasta el día siguiente.

### 1.2 Metas de calidad

> Completar: las 3-5 metas de calidad más importantes, priorizadas. El PDF de la prueba evalúa explícitamente arquitectura, buenas prácticas, seguridad, eficiencia/escalabilidad y pruebas unitarias — ver árbol de calidad en la sección 10.

| # | Meta de calidad | Escenario concreto |
|---|---|---|
| 1 | _\<ej. Seguridad>_ | _\<ej. solo usuarios autenticados con rol adecuado operan sobre turnos>_ |
| 2 | _\<...>_ | _\<...>_ |
| 3 | _\<...>_ | _\<...>_ |

### 1.3 Partes interesadas (stakeholders)

| Rol | Expectativa |
|---|---|
| Cliente (autenticado) | Agendar su propio turno con su cédula, listarlo, activarlo — sin estar en la sucursal |
| Administrador | Todo lo anterior + cancelar turnos de cualquier cliente |
| Evaluador (Amaris) | Código y arquitectura evaluables contra los criterios del PDF |

## 2. Restricciones de la arquitectura

| Tipo | Restricción |
|---|---|
| Técnica | API RESTful en C#/.NET (6, 7 u 8) — se usó **.NET 8** |
| Técnica | Front-end en **Angular** — se usó Angular 21 (standalone components, sin NgModules) |
| Técnica | Persistencia en base de datos — se usó **SQL Server** vía Docker |
| Técnica | Autenticación/autorización obligatoria sobre la API |
| Organizacional | Buenas prácticas y patrones de diseño explícitamente evaluados |
| Convención | Pruebas unitarias: **xUnit + NSubstitute + Shouldly** (backend); **Vitest** en vez de Jest (frontend) — Vitest es el runner por defecto de Angular 21, compatible en API con Jest; ver nota en sección 9 |

## 3. Alcance y contexto del sistema

### 3.1 Contexto de negocio

```
Cliente (cédula, autenticado) ──agenda/activa su turno──▶ Sistema de Turnos ──atiende──▶ Sucursal
Administrador ──cancela turnos──▶ Sistema de Turnos
```

_\<Completar: diagrama de caja negra si se quiere más formal>_

### 3.2 Contexto técnico

```
Angular SPA (:4200) ──HTTPS/JSON + JWT Bearer──▶ ASP.NET Core Web API (:5227) ──EF Core──▶ SQL Server (Docker, :1433)
```

CORS habilitado explícitamente para el origen del front (`http://localhost:4200`, configurable). Swagger disponible en desarrollo para explorar/probar la API directamente.

## 4. Estrategia de solución

| Decisión | Elección |
|---|---|
| Arquitectura backend | Clean Architecture en 4 proyectos: `Domain` → `Application` → `Infrastructure` → `Api` |
| Persistencia | Repository + Unit of Work sobre EF Core |
| Manejo de errores de negocio | Patrón `Result<TValue, TError>` (sin excepciones para flujo de negocio esperado) |
| Autenticación | JWT bearer, emitido por `POST /api/auth/login` |
| Autorización | `[Authorize]` + roles (`Administrador`, `Cliente`) vía claim de rol en el JWT |
| Frontend | Angular standalone components, lazy loading por feature |
| Concurrencia (agregado) | Transacción con aislamiento *Serializable* + reintentos, para el límite de 5 turnos/día |
| Concurrencia (fila individual) | Concurrencia optimista (`RowVersion`) en `Turno`, para evitar que dos acciones simultáneas sobre el mismo turno se pisen en silencio |

> Completar: justificación de por qué se eligió cada una (ver también sección 9, Decisiones de diseño, para el detalle de las más discutibles).

## 5. Vista de bloques de construcción

### 5.1 Backend — `Amaris.Turnos.sln`

| Proyecto | Contenido |
|---|---|
| `Amaris.Turnos.Domain` | Entidades `Turno`, `Sucursal`, `Usuario`; enums `EstadoTurno` (Pendiente/Activado/Expirado/Cancelado), `RolUsuario` (Administrador/Cliente) |
| `Amaris.Turnos.Application` | `TurnoService`, `AuthService` (reglas de negocio), `Result<TValue,TError>`, interfaces de repositorio/UoW, `TurnoOptions` |
| `Amaris.Turnos.Infrastructure` | `TurnosDbContext` (EF Core), repositorios, `UnitOfWork`, `JwtTokenGenerator`, `PasswordHasher`, `TurnoExpiracionBackgroundService` |
| `Amaris.Turnos.Api` | Controllers (`TurnosController`, `SucursalesController`, `AuthController`), DTOs, `ExceptionHandlingMiddleware`, `Program.cs` |

**Endpoints:**

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | — | Login, devuelve JWT + rol |
| POST | `/api/turnos` | Cualquier rol | Crea turno (valida cédula, sucursal activa, límite 5/día) |
| GET | `/api/turnos` | Cualquier rol | Lista turnos (filtros: sucursalId, estado, fecha, cédula) |
| GET | `/api/turnos/{id}` | Cualquier rol | Turno por id |
| POST | `/api/turnos/{id}/activar` | Cualquier rol | Activa turno dentro de la ventana de 15 min |
| POST | `/api/turnos/{id}/cancelar` | Solo Administrador | Cancela turno pendiente |
| GET | `/api/sucursales` | Público | Lista sucursales |

### 5.2 Frontend — `frontend/turnos-web`

| Carpeta | Contenido |
|---|---|
| `core/` | `auth.service.ts`, `turnos.service.ts`, `sucursales.service.ts`, `auth.interceptor.ts` (adjunta JWT), `auth.guard.ts`/`admin.guard.ts`, `reloj.service.ts`, `turnos-lista.service.ts`, `http-error.util.ts` |
| `features/auth/login/` | Formulario de login |
| `features/turnos/agendar-turno/` | Crear turno + tabla con "Activar" (cualquier rol autenticado) |
| `features/turnos/administrar-turnos/` | Misma tabla + "Cancelar" (solo Administrador) |
| `shared/models/` | Interfaces TS que reflejan los DTOs del backend |
| `shared/globo-animado/` | Componente presentacional (animación decorativa del login) |

> Completar: si se quiere, diagrama de caja negra/blanca formal de alguno de estos bloques.

## 6. Vista de ejecución (runtime)

### Escenario: agendar turno

1. Cliente envía `POST /api/turnos` con cédula + sucursal.
2. `TurnoService.CrearTurnoAsync` valida formato de cédula y que la sucursal exista/esté activa.
3. Dentro de una transacción *Serializable*: cuenta turnos de la cédula hoy (rechaza con 409 si ≥5), calcula `NumeroTurno` (correlativo por sucursal/día), inserta el turno en `Pendiente` con `FechaHoraExpiracion = ahora + 15min`.

### Escenario: expiración automática

- **Perezosa:** si se intenta activar un turno vencido, se marca `Expirado` en ese momento.
- **Proactiva:** `TurnoExpiracionBackgroundService` corre cada N segundos (configurable) y expira en bloque los turnos `Pendiente` vencidos.

### Escenario: conflicto de concurrencia

Dos solicitudes simultáneas sobre el *mismo* turno (ej. doble clic en "Activar", o un admin cancelando justo cuando expira): la segunda escritura falla por el `RowVersion` desactualizado → `409 Conflict`, en vez de perderse en silencio.

### Escenario: login y autorización

1. `POST /api/auth/login` valida credenciales (hash con `PasswordHasher<Usuario>`), emite JWT con claim de rol.
2. El frontend adjunta el token en cada request (`auth.interceptor.ts`).
3. Un 401 en cualquier request autenticado cierra la sesión y redirige a login.

> Completar: diagramas de secuencia si se quiere ilustrar alguno de estos flujos visualmente.

## 7. Vista de despliegue

| Elemento | Detalle |
|---|---|
| Base de datos | SQL Server 2022, contenedor Docker (`docker-compose.yml`), puerto 1433 |
| Backend (dev) | `dotnet run --project backend/src/Amaris.Turnos.Api`, `http://localhost:5227`, Swagger en `/swagger` |
| Frontend (dev) | `ng serve`, `http://localhost:4200` |
| Configuración | `appsettings.json` (versionado, sin secretos) + `appsettings.Development.json` (gitignored, valores reales locales) + `.env` en la raíz para Docker |

> Completar: pasos de ejecución detallados (ya cubiertos en el README) y, si aplica, un despliegue real (no solo local).

## 8. Conceptos transversales

| Concepto | Cómo se resuelve |
|---|---|
| Autenticación/autorización | JWT bearer + roles (`Administrador`/`Cliente`), `[Authorize(Roles=...)]` en el endpoint de cancelar |
| Manejo de errores | `Result<TValue,TError>` para errores de negocio esperados (400/404/409); `ExceptionHandlingMiddleware` para lo no esperado (500 en JSON sin stack trace) |
| Concurrencia de agregado | Transacción *Serializable* + reintentos (`UnitOfWork.EjecutarTransaccionSerializableAsync`) — protege el conteo de 5 turnos/día |
| Concurrencia de entidad | `RowVersion` (concurrencia optimista) en `Turno` |
| Configuración | Constantes de negocio (límite diario, minutos de expiración, intervalo del background job, reintentos, origen CORS) vía `IOptions<T>`, no hardcodeadas |
| Expiración de sesión (frontend) | Interceptor HTTP detecta 401 → limpia sesión → redirige a login |

## 9. Decisiones de diseño

> Completar la columna "Justificación" con tu propio razonamiento — aquí solo se deja registrada la decisión tomada, para que no se pierda.

| Decisión | Alternativa(s) descartada(s) | Justificación |
|---|---|---|
| "Actualizar turno" del PDF se implementó como `POST /turnos/{id}/activar`, sin un PUT genérico | PUT genérico de campos arbitrarios | _\<completar>_ |
| SQL Server vía Docker | SQLite, PostgreSQL | _\<completar>_ |
| JWT propio en vez de ASP.NET Core Identity completo | Identity completo | _\<completar>_ |
| Vitest en vez de Jest en el frontend | Instalar Jest explícitamente | Vitest es el runner por defecto de Angular 21, API compatible con Jest |
| Rol "Cliente" en vez de invitados/API pública para crear turnos | `POST /turnos` público sin login | El PDF no especifica cómo se identifica al cliente al usar la app/web — se interpretó que ya está autenticado en la app/portal del banco (como en un banco real), no que cualquiera pueda crear turnos sin sesión |
| "Cancelar" turno exclusivo de Administrador | Todos los roles con los mismos permisos | _\<completar — decisión de producto, no viene del PDF>_ |
| Token JWT en `sessionStorage` en vez de `localStorage` | `localStorage`, cookie httpOnly | Para una app bancaria, acota la ventana de exposición si la máquina queda desatendida |
| Dominio "anémico" (entidades sin comportamiento propio, reglas en Application) | Entidades ricas con métodos de transición de estado | _\<completar>_ |

## 10. Requisitos de calidad

### 10.1 Árbol de calidad

Raíz: *calidad de la solución*, ramas = los 5 criterios explícitos del PDF:

- Diseño de arquitectura
- Buenas prácticas de código
- Seguridad
- Eficiencia y escalabilidad
- Pruebas unitarias

### 10.2 Escenarios de calidad

| Escenario | Resultado esperado |
|---|---|
| Dos solicitudes simultáneas de la misma cédula, ambas en el 5º turno del día | Solo una tiene éxito, la otra recibe 409 |
| Un turno pendiente sin activar tras 15 minutos | Pasa a Expirado sin intervención manual |
| Request sin JWT válido a un endpoint protegido | 401 |
| Cliente intenta cancelar un turno | 403 (solo Administrador puede) |
| 116 pruebas automáticas (51 backend, 65 frontend) | Todas en verde |

> Completar: escenarios adicionales que se quieran destacar, con números si aplica (tiempos de respuesta, etc.).

## 11. Riesgos y deuda técnica

| Riesgo / deuda | Estado |
|---|---|
| Ventana de hasta N segundos donde el frontend puede mostrar "Expirado" (calculado contra el reloj del navegador) antes de que el background job actualice la base de datos | Aceptado — comportamiento esperado del diseño, no un bug |
| Seed de usuarios con `PasswordHash` embebido en la migración/configuración de EF Core | Aceptable para un proyecto de muestra; en producción no se comitearían hashes en código fuente |
| `environment.ts`/`environment.development.ts` del frontend son idénticos | Pendiente de un valor real de producción |
| Dominio anémico (ver sección 9) | Decisión consciente, documentada |

> Completar: cualquier riesgo adicional identificado, con una medida sugerida de mitigación.

## 12. Glosario

| Término | Definición |
|---|---|
| Turno | Solicitud de atención en una sucursal, con cédula, sucursal, hora de creación/expiración/activación y estado |
| Sucursal | Punto de atención físico de la entidad bancaria |
| Estado del turno | `Pendiente` → `Activado` \| `Expirado` \| `Cancelado` |
| Ventana de activación | Los 15 minutos desde que se agenda el turno hasta que debe activarse en sucursal |
| Cédula | Número de documento de identidad del cliente, identificador del turno |
| Cliente | Rol que puede crear, listar y activar turnos (propios) |
| Administrador | Rol que además puede cancelar turnos |
| Credenciales de prueba | `admin` / `Admin123!` (Administrador), `cliente` / `Cliente123!` (Cliente) |
