# NRS Infrastructure

## Planned runtime layout

- GitHub: source control and CI/CD
- Vercel: API/web/admin workloads
- Dedicated game server compute: authoritative real-time simulation
- PostgreSQL: durable state
- Redis/equivalent: transient coordination where justified

## Stage 0

Do not provision production resources yet.

First benchmark the game-server runtime and database topology, then provision the smallest development environment that can reliably run the five-player laboratory.
