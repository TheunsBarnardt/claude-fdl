---
title: "Multi Exec Transactions Blueprint"
layout: default
parent: "Workflow"
grand_parent: Blueprint Catalog
description: "Atomic multi-command execution with optional optimistic locking via WATCH; commands queued and executed sequentially without interruption. 5 fields. 18 outcomes"
---

# Multi Exec Transactions Blueprint

> Atomic multi-command execution with optional optimistic locking via WATCH; commands queued and executed sequentially without interruption

| | |
|---|---|
| **Feature** | `multi-exec-transactions` |
| **Category** | Workflow |
| **Version** | 1.0.0 |
| **Tags** | transactions, atomic-operations, optimistic-locking, rollback, isolation |
| **YAML Source** | [View on GitHub](https://github.com/TheunsBarnardt/claude-fdl/blob/master/blueprints/workflow/multi-exec-transactions.blueprint.yaml) |
| **JSON API** | [multi-exec-transactions.json]({{ site.baseurl }}/api/blueprints/workflow/multi-exec-transactions.json) |

## Actors

| ID | Name | Type | Description |
|----|------|------|-------------|
| `client` | Client | human | Application executing transactions |

## Fields

| Name | Type | Required | Label | Description |
|------|------|----------|-------|-------------|
| `transaction_state` | select | No |  |  |
| `queued_commands` | json | No |  |  |
| `command_results` | json | No |  |  |
| `watched_keys` | json | No |  |  |
| `abort_transaction` | boolean | No |  |  |

## States

**State field:** `undefined`

**Values:**

| State | Initial | Terminal |
|-------|---------|----------|

## Rules

- MULTI marks start of transaction; client queues commands instead of executing
- All queued commands execute sequentially without interleaving from other clients
- Syntax errors during queueing set EXECABORT flag; EXEC fails entirely
- Runtime errors during execution do not abort other commands (partial success possible)
- WATCH monitors keys; if ANY watched key modified by other client before EXEC, transaction aborts
## Rules

- **Atomicity guarantee:** Either all commands execute or none (in case of WATCH violation)

- No nested MULTI (attempt to MULTI while in transaction returns error)
## Rules

- **Transactions provide isolation:** Other clients cannot see partial state


## Outcomes

### Multi_start (Priority: 10)

**Given:**
- MULTI command
- `already_in_transaction` (db) eq `false`

**Then:**
- **transition_state** field: `transaction_state` to: `queuing`
- **set_field** target: `queued_commands` value: ``
- **emit_event** event: `transaction.started`

**Result:** client receives OK; enters queuing mode

### Nested_multi_error (Priority: 11) — Error: `NESTED_TRANSACTION`

**Given:**
- `already_in_transaction` (db) eq `true`

**Result:** error returned; transaction state unchanged

### Queue_command (Priority: 12)

**Given:**
- `transaction_state` (db) eq `queuing`
- `command` (input) not_in `EXEC,DISCARD,WATCH,UNWATCH`

**Then:**
- **set_field** target: `queued_commands` — add to queue
- **emit_event** event: `transaction.command_queued`

**Result:** client receives QUEUED; command not executed yet

### Queue_syntax_error (Priority: 13) — Error: `EXECABORT`

**Given:**
- `syntax_error` (computed) eq `true`

**Then:**
- **set_field** target: `abort_transaction` value: `true`
- **emit_event** event: `transaction.syntax_error`

**Result:** error returned; EXECABORT flag set; EXEC will fail

### Exec_transaction (Priority: 14)

**Given:**
- EXEC command
- `abort_transaction` (db) eq `false`
- `watch_violation` (db) eq `false`

**Then:**
- **transition_state** field: `transaction_state` to: `executing`
- **set_field** target: `command_results` — execute all commands in order, store results
- **transition_state** field: `transaction_state` to: `idle`
- **emit_event** event: `transaction.executed`

**Result:** array of results (one per queued command; errors as error objects)

### Exec_abort_syntax (Priority: 15) — Error: `EXECABORT`

**Given:**
- `abort_transaction` (db) eq `true`

**Then:**
- **transition_state** field: `transaction_state` to: `aborted`
- **emit_event** event: `transaction.aborted_syntax`

**Result:** error returned; transaction discarded; client back to idle

### Exec_watch_violation (Priority: 16) — Error: `WATCH_VIOLATION`

**Given:**
- `watch_violation` (db) eq `true`

**Then:**
- **transition_state** field: `transaction_state` to: `aborted`
- **emit_event** event: `transaction.aborted_watch`

**Result:** nil returned; transaction rolled back; watched keys unchanged

### Discard_transaction (Priority: 17)

**Given:**
- DISCARD command
- `transaction_state` (db) eq `queuing`

**Then:**
- **set_field** target: `queued_commands` value: `null`
- **transition_state** field: `transaction_state` to: `idle`
- **emit_event** event: `transaction.discarded`

**Result:** client receives OK; queued commands discarded

### Discard_without_transaction (Priority: 18) — Error: `NO_TRANSACTION`

**Given:**
- `transaction_state` (db) not_in `queuing`

**Result:** error returned

### Watch_keys (Priority: 20)

**Given:**
- WATCH key [key ...]
- `transaction_state` (db) in `idle,queuing`

**Then:**
- **set_field** target: `watched_keys` — add to watch list
- **emit_event** event: `transaction.keys_watched`

**Result:** client receives OK; keys now monitored

### Unwatch_keys (Priority: 21)

**Given:**
- UNWATCH command

**Then:**
- **set_field** target: `watched_keys` value: ``
- **emit_event** event: `transaction.watch_cleared`

**Result:** client receives OK; watch list cleared

### Watch_violation_detected (Priority: 22)

**Given:**
- `watched_key_modified` (system) eq `true`
- `modifier_client` (system) eq

**Then:**
- **set_field** target: `watch_violation` value: `true`
- **emit_event** event: `transaction.watch_violated`

**Result:** next EXEC returns nil (abort)

### Optimistic_lock_read (Priority: 30)

**Given:**
- GET key (before MULTI)
- WATCH key

**Then:**
- **emit_event** event: `transaction.optimistic_read`

**Result:** value retrieved; key now watched

### Optimistic_lock_compute (Priority: 31)

**Given:**
- `new_value` (computed) eq

**Then:**
- **emit_event** event: `transaction.value_computed`

**Result:** application prepares new value

### Optimistic_lock_execute (Priority: 32)

**Given:**
- MULTI ... SET key new_value ... EXEC
- `key_unchanged` (db) eq `true`

**Then:**
- **emit_event** event: `transaction.lock_acquired`

**Result:** EXEC succeeds; new value set

### Optimistic_lock_retry (Priority: 33)

**Given:**
- `watch_violation` (db) eq `true`

**Then:**
- **emit_event** event: `transaction.lock_failed`

**Result:** EXEC returns nil; application retries (GET, compute, MULTI/EXEC)

### Command_runtime_error (Priority: 40)

**Given:**
- `command_executing` (system) eq
- `runtime_error` (system) eq `true`

**Then:**
- **emit_event** event: `transaction.command_error`

**Result:** error stored in results array for that command; other commands still execute

### Partial_execution (Priority: 41)

**Given:**
- `mixed_results` (computed) eq `true`

**Then:**
- **emit_event** event: `transaction.partial_success`

**Result:** EXEC returns array with mix of values and error objects

## Errors

| Code | Status | Message | Retry |
|------|--------|---------|-------|
| `NESTED_TRANSACTION` |  | MULTI calls can not be nested | No |
| `EXECABORT` |  | EXECABORT Transaction discarded because of previous errors | No |
| `NO_TRANSACTION` |  | DISCARD without MULTI | No |
| `WATCH_VIOLATION` |  | WATCH violation (returned as nil, not error) | No |

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

## Related Blueprints

| Feature | Relationship | Reason |
|---------|-------------|--------|
| string-key-value | optional | Often used to atomically update multiple keys |
| lua-scripting | optional | Both provide atomicity; scripting more powerful for complex logic |

<details>
<summary><strong>Extensions (framework-specific hints)</strong></summary>

```yaml
source:
  repo: https://github.com/redis/redis
  project: Redis
  tech_stack: C
  files_traced: 1
  entry_points:
    - src/multi.c
```

</details>


<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "Multi Exec Transactions Blueprint",
  "description": "Atomic multi-command execution with optional optimistic locking via WATCH; commands queued and executed sequentially without interruption. 5 fields. 18 outcomes",
  "programmingLanguage": "YAML",
  "codeRepository": "https://github.com/TheunsBarnardt/claude-fdl",
  "license": "https://opensource.org/licenses/MIT",
  "keywords": "transactions, atomic-operations, optimistic-locking, rollback, isolation"
}
</script>
