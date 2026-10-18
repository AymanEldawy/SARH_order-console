# Scale Memo: Scaling SARH Orders Console to 5 Million Orders

**Author**: Senior Full Stack Engineer  
**Scenario**: 5,000,000 orders (~15,000,000 line items), 3 core developers, operational agents working across 2 countries.

---

## 1. What Changes (Triggered by Measurable Evidence)

We do not add infrastructure simply because a number is larger. Every architectural change must be justified by an observed bottleneck or concrete operational risk:

### A. Database Storage & Partitioning (Range Partitioning by Date)
- **Bottleneck**: At 5M orders, the `orders` and `order_items` tables will reach ~6 GB data and ~2.5 GB B-tree index space. When index sizes approach the PostgreSQL buffer pool (`shared_buffers`), disk random I/O spikes.
- **Change**: Introduce PostgreSQL native **Range Partitioning by Quarter** on `createdAt` (e.g., `orders_2026_q1`, `orders_2026_q2`). 95% of operational console searches target recent orders (last 30–60 days). Range partitioning ensures active queries hit hot in-memory partitions, keeping index scans sub-millisecond.

### B. Search Architecture (pg_trgm vs Managed Search)
- **Bottleneck**: Arbitrary substring matching (`ILIKE '%search%'`) over 5M rows will degrade without an index scan early-exit.
- **Change**: Enable PostgreSQL `pg_trgm` extension and add GIN indexes:
  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE INDEX orders_search_trgm_idx ON orders USING gin (customerName gin_trgm_ops, customerEmail gin_trgm_ops);
  ```
  This retains our zero-external-infrastructure model while accelerating partial name/email substring lookups down to < 10ms.

### C. Read/Write Split & Connection Pooling
- **Bottleneck**: Multiple agent shifts in two countries querying lists continuously while phone orders are registered.
- **Change**: 
  - Add **PgBouncer** in transaction pooling mode to manage client connection spikes without exhausting PostgreSQL memory.
  - Introduce **one PostgreSQL Read Replica** for read queries (`GET /api/orders`), reserving the Primary database strictly for transactional writes (`POST /api/orders`) and idempotency locking.

### D. Multi-Region & Timezone Normalization
- **Change**: All timestamps remain strictly `TIMESTAMPTZ` in UTC inside PostgreSQL. The API returns ISO-8601 UTC strings, and the React UI formats dates in the agent's localized browser timezone (e.g., `Asia/Riyadh` vs `Europe/London`).

### E. Idempotency Key Lifecycle & Pruning
- **Change**: Idempotency keys are designed to prevent transient double-clicks and network retries (0–7 days). Add a lightweight daily cron (`pg_cron` or scheduled worker) deleting `idempotency_records` older than 30 days:
  ```sql
  DELETE FROM idempotency_records WHERE "createdAt" < NOW() - INTERVAL '30 days';
  ```

---

## 2. What Deliberately Stays the Same

- **PostgreSQL-Enforced Duplicate Invariants**: The unique constraint on `idempotency_records(key)` inside an atomic transaction remains our non-negotiable guarantee against duplicate orders. We will not replace this with eventual consistency or in-memory caches.
- **Server-Side Validation (Zod)**: All inputs, prices, and permissions continue to be validated on the server.
- **Compact List Payloads**: The list API will continue selecting only summary fields and item counts (`_count`), avoiding loading unnecessary line items into memory.
- **Monolithic Next.js Service**: With a team of 3 developers, running a single well-structured Next.js repository avoids the massive overhead of microservice networking, distributed tracing, and contract drift.

---

## 3. What I Would Refuse to Build and Why

### 1. Irreversible Hard Deletion ("Delete all cancelled orders")
- **Refusal**: I would refuse to implement a hard SQL `DELETE` for cancelled orders.
- **Why**: Irreversible bulk deletion violates accounting auditability, destroys tax reconciliation records, prevents historical dispute investigation, and introduces catastrophic human error risks.
- **Alternative**: I will provide a status filter that excludes cancelled orders by default, and a reversible Soft-Delete / Archival mechanism that moves records older than the statutory retention period to cold compressed storage (e.g., S3 Parquet).

### 2. Premature Distributed Microservices & Kafka Event Bus
- **Refusal**: I would refuse to split this application into independent microservices or introduce Kafka/RabbitMQ for standard order registration.
- **Why**: For 5 million orders and a 3-developer team, distributed transactions (Saga patterns, outbox pattern, dual-write consistency) would cripple feature delivery. PostgreSQL easily handles thousands of writes per second when properly indexed and connection-pooled.
