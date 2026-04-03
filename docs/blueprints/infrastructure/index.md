---
title: "Infrastructure"
layout: default
parent: Blueprint Catalog
has_children: true
nav_order: 99
description: "Infrastructure blueprints."
---

# Infrastructure Blueprints

Infrastructure blueprints.

| Blueprint | Description | Version |
|-----------|-------------|----------|
| [Caching]({{ site.baseurl }}/blueprints/infrastructure/caching/) | Multi-tier caching with read-through, write-through, write-behind, and cache-aside strategies, stampede protection, and configurable invalidation | 1.0.0 |
| [Cloud Storage]({{ site.baseurl }}/blueprints/infrastructure/cloud-storage/) | Manage object storage across cloud providers with upload, download, delete, presigned URLs, multipart upload, and lifecycle policy support | 1.0.0 |
| [Database Persistence]({{ site.baseurl }}/blueprints/infrastructure/database-persistence/) | Data durability via RDB snapshots and/or AOF journaling; recover to point-in-time or exact command sequence after crash | 1.0.0 |
| [Master Replica Replication]({{ site.baseurl }}/blueprints/infrastructure/master-replica-replication/) | One-way data synchronization from master to replicas; full or partial resync with command streaming and replication backlog | 1.0.0 |
| [Message Queue]({{ site.baseurl }}/blueprints/infrastructure/message-queue/) | Process asynchronous jobs and events through a provider-agnostic message queue supporting publish, subscribe, acknowledge, retry with backoff, and dead-letter queues | 1.0.0 |
| [Sentinel And Cluster]({{ site.baseurl }}/blueprints/infrastructure/sentinel-and-cluster/) | Sentinel: automatic failover and monitoring; Cluster: distributed sharding across multiple nodes with gossip protocol | 1.0.0 |
