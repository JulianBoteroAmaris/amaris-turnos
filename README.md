# amaris-turnos

sistema de agendamiento de turnos para una entidad bancaria, prueba tecnica de amaris. backend en .net 8 (clean architecture) + frontend en angular 21.

## como correrlo

necesitas tener instalado: .net 8 sdk, node + angular cli, y docker desktop corriendo.

1. copiar el env y ponerle un password (el que sea, es solo para dev local):

```
cp .env.example .env
```

2. levantar la base de datos:

```
docker compose up -d
```

3. aplicar las migraciones y prender el backend:

```
cd backend
dotnet ef database update --project src/Amaris.Turnos.Infrastructure --startup-project src/Amaris.Turnos.Api
dotnet run --project src/Amaris.Turnos.Api
```

si te dice que no tienes la herramienta de ef, antes corre `dotnet tool install --global dotnet-ef`.

queda corriendo en `http://localhost:5227`, con swagger en `/swagger` si quieres probar la api directo ahi.

4. y el frontend, en otra terminal:

```
cd frontend/turnos-web
npm install
ng serve
```

en `http://localhost:4200`.

## para probar

ya quedaron sembrados 2 usuarios:

- `admin` / `Admin123!` — rol administrador, puede cancelar turnos
- `cliente` / `Cliente123!` — rol cliente, agenda y activa sus propios turnos

## tests

```
cd backend && dotnet test
cd frontend/turnos-web && ng test
```

## arquitectura

el detalle esta en [docs/informe-arquitectura.md](docs/informe-arquitectura.md)
