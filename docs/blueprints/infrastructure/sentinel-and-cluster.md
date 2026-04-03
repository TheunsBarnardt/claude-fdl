---
title: "Sentinel And Cluster Blueprint"
layout: default
parent: "Infrastructure"
grand_parent: Blueprint Catalog
description: "Sentinel: automatic failover and monitoring; Cluster: distributed sharding across multiple nodes with gossip protocol. 6 fields. 19 outcomes. 3 error codes. rul"
---

# Sentinel And Cluster Blueprint

> Sentinel: automatic failover and monitoring; Cluster: distributed sharding across multiple nodes with gossip protocol

| | |
|---|---|
| **Feature** | `sentinel-and-cluster` |
| **Category** | Infrastructure |
| **Version** | 1.0.0 |
| **Tags** | sentinel, cluster, failover, sharding, high-availability, auto-recovery, distributed |
| **YAML Source** | [View on GitHub](https://github.com/TheunsBarnardt/claude-fdl/blob/master/blueprints/infrastructure/sentinel-and-cluster.blueprint.yaml) |
| **JSON API** | [sentinel-and-cluster.json]({{ site.baseurl }}/api/blueprints/infrastructure/sentinel-and-cluster.json) |

## Actors

| ID | Name | Type | Description |
|----|------|------|-------------|
| `sentinel_instance` | Sentinel | system | Monitoring and failover orchestrator |
| `master` | Master | system | Primary node accepting writes |
| `replica` | Replica | system | Secondary node ready for promotion |
| `cluster_node` | Cluster Node | system | Distributed cluster participant |
| `sentinel_quorum` | Sentinel Quorum | system | Consensus for failover decisions |

## Fields

| Name | Type | Required | Label | Description |
|------|------|----------|-------|-------------|
| `sentinel_mode` | boolean | No |  |  |
| `cluster_mode` | boolean | No |  |  |
| `master_state` | select | No |  |  |
| `cluster_slots` | number | No |  |  |
| `node_slots_owned` | json | No |  |  |
| `sentinel_quorum_size` | number | No |  |  |

## States

**State field:** `undefined`

**Values:**

| State | Initial | Terminal |
|-------|---------|----------|

## Rules

- Sentinel monitors master health via PING; no response within down_after_milliseconds = SDOWN
- Quorum of Sentinels must agree (ODOWN) before failover begins
- Failover elected to one Sentinel as leader; others follow decisions
## Rules

- **During failover:** replica promoted to master, other replicas reconfigured

- Configurations written to disk and propagated via Pub/Sub
- Failed master can rejoin cluster as replica after recovery
- Data sharded across cluster nodes using hash slots (0-16383)
- Slot assignment determines which node owns which keys
- Replicas replicate their master's slots (same slot ranges)
- Multi-key operations must have all keys in same slot
- Cluster protocol via gossip (periodic node updates)
- Redirection via MOVED (permanent) or ASK (temporary)
- Cluster can rebalance slots (migrate data between nodes)

## Outcomes

### Sentinel_monitor_master (Priority: 10)

**Given:**
- `sentinel_config` (input) eq

**Then:**
- **emit_event** event: `sentinel.monitoring_started`

**Result:** Sentinel begins periodic health checks (PING, INFO)

### Sentinel_health_check (Priority: 11)

**Given:**
- `ping_no_response` (system) eq

**Then:**
- **transition_state** field: `master_health` to: `sdown`
- **emit_event** event: `sentinel.sdown_detected`

**Result:** this Sentinel marks master subjectively down

### Sentinel_quorum_agreement (Priority: 12)

**Given:**
- `other_sentinels_agree` (system) gte `quorum-1`
- `total_sentinels_agree` (computed) gte `quorum`

**Then:**
- **transition_state** field: `master_health` to: `odown`
- **emit_event** event: `sentinel.odown_detected`

**Result:** master objectively down; failover authorized

### Sentinel_leader_election (Priority: 13)

**Given:**
- `odown` (db) eq `true`
- `leader_elected` (system) eq `this_sentinel`

**Then:**
- **transition_state** field: `master_health` to: `failing_over`
- **emit_event** event: `sentinel.failover_started`

**Result:** leader begins failover state machine

### Sentinel_replica_selection (Priority: 14)

**Given:**
- `replica_candidates` (db) eq
- `selection_criteria` (system) eq

**Then:**
- **emit_event** event: `sentinel.replica_selected`

**Result:** best replica chosen for promotion

### Sentinel_promotion (Priority: 15)

**Given:**
- SLAVEOF NO ONE sent to replica

**Then:**
- **emit_event** event: `sentinel.promotion_sent`

**Result:** replica stops replication, becomes master

### Sentinel_reconfigure_replicas (Priority: 16)

**Given:**
- `new_master` (system) eq
- `other_replicas` (system) gt `0`

**Then:**
- **emit_event** event: `sentinel.replication_updated`

**Result:** other replicas point to new master

### Sentinel_failover_complete (Priority: 17)

**Given:**
- `new_master_promoted` (system) eq `true`
- `all_replicas_reconfigured` (system) eq `true`

**Then:**
- **transition_state** field: `master_health` to: `recovered`
- **emit_event** event: `sentinel.failover_complete`

**Result:** failover complete; cluster operational with new master

### Cluster_node_join (Priority: 30)

**Given:**
- CLUSTER MEET ip port
- `cluster_mode_enabled` (system) eq `true`

**Then:**
- **emit_event** event: `cluster.node_joined`

**Result:** node added to cluster; gossip begins

### Cluster_slot_assignment (Priority: 31)

**Given:**
- CLUSTER ADDSLOTS slot [slot ...]
- `slots_available` (system) eq `true`

**Then:**
- **set_field** target: `node_slots_owned`
- **emit_event** event: `cluster.slots_assigned`

**Result:** slots now served by this node

### Cluster_key_routing (Priority: 32)

**Given:**
- `key` (input) eq
- `slot` (computed) eq
- `slot_owner` (db) eq

**Then:**
- **undefined**
- **emit_event** event: `cluster.request_routed`

**Result:** command executed on slot owner or client redirected

### Cluster_moved_redirect (Priority: 33)

**Given:**
- `slot_owner_changed` (system) eq `true`

**Then:**
- **emit_event** event: `cluster.moved`

**Result:** client receives MOVED node_ip:node_port; should update slot map

### Cluster_ask_redirect (Priority: 34)

**Given:**
- `slot_importing` (db) eq `true`
- `slot_migrating_from_other` (db) eq `true`

**Then:**
- **emit_event** event: `cluster.ask`

**Result:** client receives ASK; forward request to new node; next request goes to moved node

### Cluster_slot_migration (Priority: 35)

**Given:**
- CLUSTER SETSLOT slot MIGRATING target_node_id
- target node: CLUSTER SETSLOT slot IMPORTING source_node_id

**Then:**
- **emit_event** event: `cluster.migration_started`

**Result:** slot enters migration state; data gradually moved

### Cluster_multi_key_restriction (Priority: 36) — Error: `CROSSSLOT`

**Given:**
- `command_touches_multiple_slots` (computed) eq `true`

**Then:**
- **emit_event** event: `cluster.crossslot_rejected`

**Result:** error returned; operation not allowed (use MGET, MSET on keys with same slot)

### Cluster_state_ok (Priority: 40)

**Given:**
- `all_slots_assigned` (db) eq `true`
- `all_nodes_reachable` (db) eq `true`

**Then:**
- **transition_state** field: `cluster_state` to: `ok`
- **emit_event** event: `cluster.healthy`

**Result:** cluster operational

### Cluster_state_fail (Priority: 41)

**Given:**
- `unreachable_slots` (system) gt `0`

**Then:**
- **transition_state** field: `cluster_state` to: `fail`
- **emit_event** event: `cluster.unhealthy`

**Result:** cluster enters fail state; some commands fail

### Cluster_gossip_update (Priority: 42)

**Given:**
- cluster tick (internal periodic task)

**Then:**
- **emit_event** event: `cluster.gossip_sent`

**Result:** nodes exchange health/slot info; topology discovered

### Cluster_info (Priority: 43)

**Given:**
- CLUSTER INFO

**Then:**
- **emit_event** event: `cluster.info_queried`

**Result:** cluster state info: state, slots covered/ok/fail, nodes

## Errors

| Code | Status | Message | Retry |
|------|--------|---------|-------|
| `CLUSTER_CROSSSLOT` |  | CROSSSLOT Keys in request don't hash to the same slot | No |
| `CLUSTER_SLOT_UNOWNED` |  | CLUSTERDOWN The cluster is down | No |
| `SENTINEL_NOSCRIPT` |  | Sentinel command syntax error | No |

## Events

| Event | Description | Payload |
|-------|-------------|----------|
| `undefined` |  |  |
| `undefined` |  |  |
| `undefined` |  |  |
| `undefined` |  |  |
| `undefined` |  |  |
| `undefined` |  |  |
| `undefined` |  |  |
| `undefined` |  |  |
| `undefined` |  |  |
| `undefined` |  |  |
| `undefined` |  |  |
| `undefined` |  |  |
| `undefined` |  |  |
| `undefined` |  |  |
| `undefined` |  |  |
| `undefined` |  |  |
| `undefined` |  |  |
| `undefined` |  |  |
| `undefined` |  |  |

## Related Blueprints

| Feature | Relationship | Reason |
|---------|-------------|--------|
| master-replica-replication | required | Sentinel monitors master-replica setup; Cluster uses replication for fault tolerance |
| database-persistence | optional | Both use RDB snapshots for recovery |

<details>
<summary><strong>Extensions (framework-specific hints)</strong></summary>

```yaml
source:
  repo: https://github.com/redis/redis
  project: Redis
  tech_stack: C
  files_traced: 2
  entry_points:
    - src/sentinel.c
    - src/cluster.c
```

</details>


<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "Sentinel And Cluster Blueprint",
  "description": "Sentinel: automatic failover and monitoring; Cluster: distributed sharding across multiple nodes with gossip protocol. 6 fields. 19 outcomes. 3 error codes. rul",
  "programmingLanguage": "YAML",
  "codeRepository": "https://github.com/TheunsBarnardt/claude-fdl",
  "license": "https://opensource.org/licenses/MIT",
  "keywords": "sentinel, cluster, failover, sharding, high-availability, auto-recovery, distributed"
}
</script>
