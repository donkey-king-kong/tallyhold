# ADR 0001: Modular monolith with layered architecture

## Context

One developer and an agent team need a multi-user portfolio API with independently extensible brokers, asset types, prices and metrics. The frontend renders its own UI. The design must make OOP, SOLID and relational boundaries explicit without distributed deployment overhead.

## Decision

Use one FastAPI deployable, split into the modules named in the [product spec](../spec.md) and four layers: presentation -> application -> domain interfaces; infrastructure implements those interfaces. Keep the Next.js frontend separate and expose versioned JSON REST under `/api/v1`. Inject infrastructure adapters into services, leaving domain logic pure Python.

## Alternatives considered

- Microservices: independent deployments do not benefit this team yet; network calls, distributed data and operations add cost. Module boundaries leave later extraction possible.
- Classic server-rendered MVC: the separate Next.js client owns rendering, while FastAPI serves JSON. Routers, schemas and domain still serve controller/view/model-like responsibilities without coupling UI to the server.

## Consequences

One backend deployment and database simplify development, but modules share operational fate and require disciplined internal boundaries. Interfaces and dependency injection add upfront structure and enable isolated tests and new adapters without changing services.
