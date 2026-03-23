---
trigger: always_on
---

## Rules

* **Technology Stack:** The "antigravity" project must be developed exclusively using **TypeScript**. Ensure strict typing and avoid the use of `any` to maintain type safety.
* **Microservices Architecture:** The project must be designed and implemented strictly using a microservices architecture. Services should be loosely coupled, independently deployable, and highly cohesive.
* **Clean Code & Documentation:** Strictly adhere to Clean Code principles (SOLID, DRY, KISS). While the code itself must be in English, **all code comments and documentation within the files MUST be written in Turkish.**
* **Architectural Style (Hexagonal):** Use **Hexagonal Architecture** (Ports & Adapters) to ensure business logic is isolated from infrastructure and external dependencies.
* **Design Patterns & Error Handling:** Proactively apply appropriate software design patterns (e.g., Factory, Strategy, Observer) to solve structural problems and handle errors. The architecture should be resilient and scalable.
* **Logging & Debugging:** Pay extreme attention to logging during error handling and debugging processes. Ensure logs are descriptive, categorized by severity, and provide enough context to trace issues across microservices.
* **Asynchronous Communication:** Favor **Event-Driven** architecture using message brokers (e.g., RabbitMQ, Redis) for inter-service communication to ensure loose coupling.
* **Configuration Management:** Strictly manage secrets and environment variables using external configurations (e.g., .env or Secret Managers); never hardcode sensitive data.
* **Turkish Planning Documents:** All project planning files, architectural roadmaps, and step-by-step task breakdowns **MUST** be generated and provided in Turkish.