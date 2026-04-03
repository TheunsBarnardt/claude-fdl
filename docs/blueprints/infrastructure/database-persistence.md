---
title: "Database Persistence Blueprint"
layout: default
parent: "Infrastructure"
grand_parent: Blueprint Catalog
description: "Data durability via RDB snapshots and/or AOF journaling; recover to point-in-time or exact command sequence after crash. 6 fields. 20 outcomes. 3 error codes. r"
---

# Database Persistence Blueprint

> Data durability via RDB snapshots and/or AOF journaling; recover to point-in-time or exact command sequence after crash

| | |
|---|---|
| **Feature** | `database-persistence` |
| **Category** | Infrastructure |
| **Version** | 1.0.0 |
| **Tags** | persistence, durability, rdb-snapshots, aof-journal, crash-recovery, backup |
| **YAML Source** | [View on GitHub](https://github.com/TheunsBarnardt/claude-fdl/blob/master/blueprints/infrastructure/database-persistence.blueprint.yaml) |
| **JSON API** | [database-persistence.json]({{ site.baseurl }}/api/blueprints/infrastructure/database-persistence.json) |

## Actors

| ID | Name | Type | Description |
|----|------|------|-------------|
| `database` | Database | system | Redis server persisting data |
| `persistence_engine` | Persistence Engine | system | Background save/rewrite processes |
| `storage` | Storage | system | Disk or filesystem for persisted data |

## Fields

| Name | Type | Required | Label | Description |
|------|------|----------|-------|-------------|
| `persistence_mode` | select | No |  |  |
| `rdb_file` | text | No |  |  |
| `aof_file` | text | No |  |  |
| `last_save_time` | number | No |  |  |
| `fsync_policy` | select | No |  |  |
| `recovery_point` | text | No |  |  |

## States

**State field:** `undefined`

**Values:**

| State | Initial | Terminal |
|-------|---------|----------|

## Rules

- RDB snapshots are point-in-time; commands after snapshot are lost on crash
- AOF journaling logs every write command; replaying recovers to exact state before crash
- RDB snapshots smaller but slower to load; AOF larger but can replay incrementally
- Fsync policy determines durability vs. performance tradeoff (always=safe, no=fast)
- RDB snapshot created via fork; uses copy-on-write to minimize memory overhead
- AOF rewrite compacts journal into snapshot + recent commands (background process)
## Rules

- **RDB + AOF together:** fastest load (RDB) + maximum durability (AOF)

- Persistence operations are transparent; do not block client commands (background)
- Files are atomic; writes to temp files then renamed

## Outcomes

### Rdb_save_sync (Priority: 10)

**Given:**
- SAVE command

**Then:**
- **transition_state** field: `rdb_save_state` to: `saving`
- **emit_event** event: `rdb.save_started`

**Result:** server blocks; snapshot written to disk; client receives OK

### Rdb_bgsave (Priority: 11)

**Given:**
- BGSAVE command
- `no_other_save_in_progress` (system) eq `true`

**Then:**
- **transition_state** field: `rdb_save_state` to: `saving`
- **emit_event** event: `rdb.bgsave_started`

**Result:** background process started; client receives OK immediately

### Rdb_save_complete (Priority: 12)

**Given:**
- `rdb_save_succeeds` (system) eq `true`

**Then:**
- **set_field** target: `last_save_time`
- **transition_state** field: `rdb_save_state` to: `saved`
- **emit_event** event: `rdb.save_complete`

**Result:** snapshot available for recovery

### Rdb_save_failed (Priority: 13) — Error: `BGSAVE_FAILED`

**Given:**
- `rdb_save_fails` (system) eq `true`
- `failure_reason` (system) eq

**Then:**
- **transition_state** field: `rdb_save_state` to: `save_failed`
- **emit_event** event: `rdb.save_failed`

**Result:** save aborted; existing snapshot unchanged; server continues

### Rdb_lastsave (Priority: 14)

**Given:**
- LASTSAVE command

**Then:**
- **emit_event** event: `rdb.lastsave_queried`

**Result:** Unix timestamp of last successful save (or 0 if never saved)

### Aof_write_command (Priority: 20)

**Given:**
- any write command (SET, DEL, LPUSH, etc.)
- `aof_enabled` (system) eq `true`

**Then:**
- **emit_event** event: `aof.command_logged`

**Result:** command written to AOF buffer (fsync per policy)

### Aof_fsync_always (Priority: 21)

**Given:**
- `fsync_policy` (db) eq `always`

**Then:**
- **emit_event** event: `aof.fsync`

**Result:** AOF durability guaranteed; write latency increased

### Aof_fsync_everysec (Priority: 22)

**Given:**
- `fsync_policy` (db) eq `everysec`

**Then:**
- **emit_event** event: `aof.periodic_fsync`

**Result:** good balance of durability and performance

### Aof_fsync_no (Priority: 23)

**Given:**
- `fsync_policy` (db) eq `no`

**Then:**
- **emit_event** event: `aof.os_fsync`

**Result:** fastest but least durable; data loss possible on crash

### Aof_rewrite (Priority: 24)

**Given:**
- BGREWRITEAOF command
- `no_rewrite_in_progress` (system) eq `true`

**Then:**
- **transition_state** field: `aof_rewrite_state` to: `rewriting`
- **emit_event** event: `aof.rewrite_started`

**Result:** background rewrite process started

### Aof_rewrite_complete (Priority: 25)

**Given:**
- `aof_rewrite_succeeds` (system) eq `true`

**Then:**
- **transition_state** field: `aof_rewrite_state` to: `rewritten`
- **emit_event** event: `aof.rewrite_complete`

**Result:** AOF compacted; future appends continue on new AOF

### Aof_rewrite_failed (Priority: 26) — Error: `BGREWRITEAOF_FAILED`

**Given:**
- `aof_rewrite_fails` (system) eq

**Then:**
- **transition_state** field: `aof_rewrite_state` to: `rewrite_failed`
- **emit_event** event: `aof.rewrite_failed`

**Result:** rewrite aborted; old AOF continues

### Recovery_rdb_only (Priority: 30)

**Given:**
- `persistence_mode` (system) eq `rdb_only`
- server startup

**Then:**
- **emit_event** event: `persistence.recovery_rdb`

**Result:** database loaded from RDB; commands after snapshot lost

### Recovery_aof_only (Priority: 31)

**Given:**
- `persistence_mode` (system) eq `aof_only`

**Then:**
- **emit_event** event: `persistence.recovery_aof`

**Result:** database recovered to exact state before crash

### Recovery_rdb_and_aof (Priority: 32)

**Given:**
- `persistence_mode` (system) eq `rdb_and_aof`

**Then:**
- **emit_event** event: `persistence.recovery_hybrid`

**Result:** fast load (RDB) with exact state (AOF replay)

### Recovery_aof_truncated (Priority: 33)

**Given:**
- `aof_last_command_incomplete` (system) eq `true`

**Then:**
- **emit_event** event: `persistence.aof_truncated`

**Result:** incomplete command skipped; recovery continues with earlier commands

### Recovery_aof_corruption (Priority: 34) — Error: `CORRUPTED_AOF`

**Given:**
- `aof_corrupted_mid_command` (system) eq `true`

**Then:**
- **emit_event** event: `persistence.aof_corrupt`

**Result:** admin must use redis-check-aof tool to fix; recovery manual

### Backup_via_rdb (Priority: 40)

**Given:**
- `strategy` (system) eq `snapshot-based`

**Then:**
- **emit_event** event: `persistence.backup_rdb`

**Result:** small backup files; fast restore; acceptable data loss window

### Backup_via_replication (Priority: 41)

**Given:**
- `strategy` (system) eq `replica-based`

**Then:**
- **emit_event** event: `persistence.backup_replica`

**Result:** replicas take RDB snapshots while staying up-to-date

### Backup_hybrid (Priority: 42)

**Given:**
- `persistence_mode` (system) eq `rdb_and_aof`

**Then:**
- **emit_event** event: `persistence.backup_hybrid`

**Result:** maximum durability; largest disk footprint

## Errors

| Code | Status | Message | Retry |
|------|--------|---------|-------|
| `BGSAVE_FAILED` |  | Background save failed | No |
| `BGREWRITEAOF_FAILED` |  | Background AOF rewrite failed | No |
| `CORRUPTED_AOF` |  | The AOF file is corrupted | No |

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
| `undefined` |  |  |

## Related Blueprints

| Feature | Relationship | Reason |
|---------|-------------|--------|
| master-replica-replication | optional | Replicas can hold backup snapshots |
| key-expiration | optional | Expired keys may or may not be persisted |

<details>
<summary><strong>Extensions (framework-specific hints)</strong></summary>

```yaml
source:
  repo: https://github.com/redis/redis
  project: Redis
  tech_stack: C
  files_traced: 2
  entry_points:
    - src/rdb.c
    - src/aof.c
```

</details>


<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "Database Persistence Blueprint",
  "description": "Data durability via RDB snapshots and/or AOF journaling; recover to point-in-time or exact command sequence after crash. 6 fields. 20 outcomes. 3 error codes. r",
  "programmingLanguage": "YAML",
  "codeRepository": "https://github.com/TheunsBarnardt/claude-fdl",
  "license": "https://opensource.org/licenses/MIT",
  "keywords": "persistence, durability, rdb-snapshots, aof-journal, crash-recovery, backup"
}
</script>
