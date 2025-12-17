# Back End Challenge (2025)

This repository contains a NestJS/TypeScript implementation of the challenge described in the document "Back End Challenge (2025).pdf" located at the project root.

## Overview

- Framework: NestJS 11 (GraphQL, schema-first)
- Database: PostgreSQL (via Prisma ORM)
- Infrastructure: Docker/Docker Compose
- Data ingestion: External XML APIs, exponential retries, controlled concurrency
- Logging: `nestjs-pino` with `pino-pretty` in development
- Configuration: Global configuration module with default values and environment variables

## Main Topics

The items below describe the main challenge requirements and how they are covered in this project:

- GraphQL API for domain entities
  - Types and SDL schema in [src/resources/make/schema.graphql](src/resources/make/schema.graphql) and [src/resources/vehicle/schema.graphql](src/resources/vehicle/schema.graphql).
  - Implemented queries: `makes`, `make(id)`, `vehicleTypes`, `vehicleType(id)`, `vehicleTypesByMakeId(makeId)`.
  - Mutations: `createMake`, `updateMake`, `deleteMake`, `createVehicleType`, `updateVehicleType`, `deleteVehicleType`.
  - Subscriptions: `makeCreated`, `vehicleTypeCreated` (baseline for events).

- Relationships between entities
  - `Make.vehicleType: [VehicleType!]!` resolved in [src/resources/make/make.resolver.ts](src/resources/make/make.resolver.ts).
  - `VehicleType.make: Make!` resolved in [src/resources/vehicle/vehicle.resolver.ts](src/resources/vehicle/vehicle.resolver.ts).

- Persistence with Prisma + PostgreSQL
  - Prisma service in [src/prisma/prisma.service.ts](src/prisma/prisma.service.ts) with `@prisma/adapter-pg` and connection at initialization.
  - Composite unique key for `VehicleType` by `(makeId, vehicleTypeId)` used in upserts (see [src/data-ingestion.provider.ts](src/data-ingestion.provider.ts#L73-L107)).

- External data ingestion
  - Provider in [src/data-ingestion.provider.ts](src/data-ingestion.provider.ts):
    - Fetches `Makes` and `VehicleTypes` from configurable URLs.
    - XML parsing with `fast-xml-parser`.
    - `fetchWithRetry` with exponential backoff, jitter and timeout.
    - Concurrency limited with `p-limit`, configurable via `MAX_CONCURRENT_FETCHS`.
    - Automatic execution at application bootstrap.

- Environment-based configuration with defaults
  - Global configuration module: [src/config/config.module.ts](src/config/config.module.ts).
  - Reading `PORT`, `DATABASE_URL`, ingestion URLs and retry/concurrency parameters with default values and `.env` support.
  - Use of `ConfigService` in `main.ts` and providers.

- Structured logging
  - `nestjs-pino` configured in [src/app.module.ts](src/app.module.ts) and initialization in [src/main.ts](src/main.ts).
  - Pretty output in development and appropriate level in production.

- Docker and Compose
  - Production Dockerfile: [Dockerfile](Dockerfile).
  - Compose with `api` and `db` services: [docker-compose.yml](docker-compose.yml), healthcheck, environment variables and port mapping.

## Architecture

- `src/app.module.ts`: root module with GraphQL, Logger and domain modules.
- `src/modules/*`: domain modules, services and resolvers (`Make`, `VehicleType`).
- `src/prisma/*`: integration with Prisma Client and Prisma module.
- `src/config/config.module.ts`: environment aggregation and defaults.
- `src/data-ingestion.provider.ts`: ingestion and persistence pipeline.

## Setup (optional)

Create a `.env` file  with your values. Examples of supported variables are listed below.
This step is not mandatory, as default values are set on ConfigModule.

## Running with Docker

```bash
docker compose up --build -d
```

After startup, access the Playground: `http://localhost:<PORT>/graphql`.
The `api` service exposes port `4000` by default (configurable via `PORT`). The `db` service uses `postgres:16-alpine` with Compose default credentials (default port exposed: `5432`).

## Environment Variables (defaults)

- `NODE_ENV`: `development` | `test` | `production` (default: `development`)
- `PORT`: API port (default: `4000`)
- `DATABASE_URL`: PostgreSQL connection (default: `postgresql://myuser:mypassword@db:5432/pdgb`)
- `MAKES_URL`: source URL for `Makes` (default: `https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=XML`)
- `VEHICLE_TYPES_URL`: `https://vpic.nhtsa.dot.gov/api/vehicles/GetVehicleTypesForMakeId/{makeId}?format=XML`
- `MAX_MAKES_TO_INGEST`: limit ingestion (default: `0` → no limit)
- `MAX_CONCURRENT_FETCHS`: vehicle types fetching concurrency (default: `12`)
- `RETRY_ATTEMPTS`: retry attempts (default: `5`)
- `RETRY_BASE_DELAY_MS`: backoff base (default: `8000`)
- `RETRY_MAX_DELAY_MS`: max delay (default: `800000`)

## GraphQL Schema (summary)

- `type Make { id, makeId, makeName, vehicleType: [VehicleType!]! }`
- `type VehicleType { id, vehicleTypeId, vehicleTypeName, makeId, make: Make! }`

Queries:

```graphql
query {
  makes { id makeId makeName vehicleType { vehicleTypeId vehicleTypeName } }
}

query($id: String!) { make(id: $id) { id makeName } }

query($makeId: String!) { vehicleTypesByMakeId(makeId: $makeId) { vehicleTypeId vehicleTypeName } }
```

Mutations (examples):

```graphql
mutation {
  createMake(input: { 
    makeId: "123",
    makeName: "Foo" 
  }) {
    id
    makeId
    makeName
  }
}

mutation {
  createVehicleType(input: { 
    vehicleTypeId: "1",
    vehicleTypeName: "SUV", 
    makeId: "123" 
  }) { 
    id
  }
}
```

## Data Ingestion

- Automatic execution at bootstrap: [src/data-ingestion.provider.ts](src/data-ingestion.provider.ts#L145-L171).
- Retries with exponential backoff and timeout.
- Flow:
  1. `getMakes()` reads `MAKES_URL` → parses XML → normalizes.
  2. For each Make, fetches `VehicleTypes` via `VEHICLE_TYPES_URL` (replaces `{makeId}`) with `p-limit` concurrency.
  3. Persists via Prisma `upsert` using composite key `(makeId, vehicleTypeId)`.

## Database and Prisma

- Schema: `prisma/schema.prisma` (models `Make` and `VehicleType`).
- Client generated in `generated/prisma`.
- Composite unique key applied to `VehicleType` to ensure consistency in upserts.

## Logging

- Configuration in [src/app.module.ts](src/app.module.ts).
- Usage in `main.ts` and the ingestion provider for structured logs.

<!-- ## Limitations and Next Steps

- Prisma migrations may require sanitizing existing data (e.g., mandatory `makeId` in `VehicleType`).
- Validation and authentication are not included in the current scope.
- Basic subscriptions are present; production requires appropriate transport.
- Adjust concurrency and retry limits according to the external source SLA. -->
