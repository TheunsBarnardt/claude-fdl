---
title: "Lua Scripting Blueprint"
layout: default
parent: "Workflow"
grand_parent: Blueprint Catalog
description: "Server-side Lua script execution providing atomic operations, programmatic logic, and access to all Redis commands within a single round-trip. 7 fields. 21 outc"
---

# Lua Scripting Blueprint

> Server-side Lua script execution providing atomic operations, programmatic logic, and access to all Redis commands within a single round-trip

| | |
|---|---|
| **Feature** | `lua-scripting` |
| **Category** | Workflow |
| **Version** | 1.0.0 |
| **Tags** | lua-scripting, server-side-execution, atomic-operations, stored-procedures |
| **YAML Source** | [View on GitHub](https://github.com/TheunsBarnardt/claude-fdl/blob/master/blueprints/workflow/lua-scripting.blueprint.yaml) |
| **JSON API** | [lua-scripting.json]({{ site.baseurl }}/api/blueprints/workflow/lua-scripting.json) |

## Actors

| ID | Name | Type | Description |
|----|------|------|-------------|
| `client` | Client | human | Application sending scripts to execute |

## Fields

| Name | Type | Required | Label | Description |
|------|------|----------|-------|-------------|
| `script_source` | text | No |  |  |
| `script_sha` | text | No |  |  |
| `num_keys` | number | No |  |  |
| `keys_array` | json | No |  |  |
| `argv_array` | json | No |  |  |
| `script_result` | text | No |  |  |
| `execution_time_ms` | number | No |  |  |

## States

**State field:** `undefined`

**Values:**

| State | Initial | Terminal |
|-------|---------|----------|

## Rules

- Scripts execute atomically; no other commands interleave during execution
- Script has access to all Redis commands via redis.call() or redis.pcall()
- redis.call() raises error if command fails; redis.pcall() returns error table
- Scripts are sandboxed; no file I/O, network access, or dangerous Lua operations
- Replicas execute scripts read-only (writes not allowed on replicas)
- Scripts are cached by SHA1; same script executed multiple times via EVALSHA
- Script cache persists for server lifetime or until FLUSHDB/FLUSHALL
- Numeric types preserved; float operations return integers where possible
- Long-running scripts can be SCRIPT KILL if timeout exceeded

## Outcomes

### Eval_inline_script (Priority: 10)

**Given:**
- EVAL script numkeys [key ...] [arg ...]
- `script` (input) eq
- `numkeys` (input) eq

**Then:**
- **set_field** target: `script_source`
- **set_field** target: `keys_array` — first numkeys arguments
- **set_field** target: `argv_array` — remaining arguments
- **transition_state** field: `script_state` to: `executing`
- **emit_event** event: `script.executed`

**Result:** script result returned (value, error, or nil)

### Evalsha_cached (Priority: 11)

**Given:**
- EVALSHA sha1 numkeys [key ...] [arg ...]
- `script_cached` (db) eq `true`

**Then:**
- **set_field** target: `keys_array`
- **set_field** target: `argv_array`
- **transition_state** field: `script_state` to: `executing`
- **emit_event** event: `script.executed_cached`

**Result:** script result returned

### Evalsha_not_found (Priority: 12) — Error: `NOSCRIPT`

**Given:**
- `script_cached` (db) eq `false`

**Then:**
- **emit_event** event: `script.not_found`

**Result:** NOSCRIPT error returned; client can retry with EVAL

### Script_result_string (Priority: 13)

**Given:**
- `script_returns` (computed) eq `string`

**Then:**
- **set_field** target: `script_result`
- **emit_event** event: `script.result_string`

**Result:** string value returned to client

### Script_result_number (Priority: 14)

**Given:**
- `script_returns` (computed) eq `number`

**Then:**
- **set_field** target: `script_result`
- **emit_event** event: `script.result_number`

**Result:** number value returned

### Script_result_array (Priority: 15)

**Given:**
- `script_returns` (computed) eq `table`

**Then:**
- **emit_event** event: `script.result_array`

**Result:** array returned with nested structures preserved

### Script_result_error (Priority: 16)

**Given:**
- redis.error_reply('message')

**Then:**
- **emit_event** event: `script.result_error`

**Result:** error returned to client

### Script_runtime_error (Priority: 17) — Error: `SCRIPT_ERROR`

**Given:**
- `lua_error` (computed) eq `true`

**Then:**
- **emit_event** event: `script.runtime_error`

**Result:** error returned; database unchanged

### Script_redis_error (Priority: 18)

**Given:**
- redis.call() fails

**Then:**
- **emit_event** event: `script.redis_call_error`

**Result:** error returned; script aborted; database unchanged (atomic)

### Script_redis_error_handled (Priority: 19)

**Given:**
- redis.pcall() returns error

**Then:**
- **emit_event** event: `script.redis_pcall_error`

**Result:** error table passed to Lua; script continues

### Script_call_redis_command (Priority: 20)

**Given:**
- redis.call('SET', 'key', 'value') or redis.pcall(...)

**Then:**
- **emit_event** event: `script.redis_command_executed`

**Result:** command executes atomically; result returned to script

### Script_load (Priority: 30)

**Given:**
- SCRIPT LOAD script
- `script` (input) eq

**Then:**
- **set_field** target: `script_sha` — compute SHA1 digest
- **set_field** target: `script_state` value: `cached`
- **emit_event** event: `script.loaded`

**Result:** SHA1 digest returned (can later use with EVALSHA)

### Script_exists (Priority: 31)

**Given:**
- SCRIPT EXISTS sha1 [sha1 ...]
- `shas` (input) eq

**Then:**
- **emit_event** event: `script.exists_checked`

**Result:** array of 0/1 for each SHA (1=cached, 0=not found)

### Script_flush (Priority: 32)

**Given:**
- SCRIPT FLUSH [ASYNC|SYNC]
- `mode` (input) eq

**Then:**
- **set_field** target: `script_state` value: `not_cached`
- **emit_event** event: `script.cache_flushed`

**Result:** OK returned; all cached scripts deleted

### Script_kill (Priority: 33)

**Given:**
- SCRIPT KILL
- `script_executing` (system) eq `true`
- `execution_time_exceeds_timeout` (system) eq `true`

**Then:**
- **emit_event** event: `script.killed`

**Result:** script terminated; OK returned (or error if cannot kill)

### Script_call_denied (Priority: 34) — Error: `SCRIPT_KILLED`

**Given:**
- `script_killed_mid_execution` (system) eq `true`

**Then:**
- **emit_event** event: `script.call_denied`

**Result:** redis.call() rejects further execution; SCRIPT KILL succeeded

### Sandbox_no_file_io (Priority: 40) — Error: `SCRIPT_ERROR`

**Given:**
- io.open(), os.execute(), etc.

**Then:**
- **emit_event** event: `script.sandbox_violation`

**Result:** error returned; script aborted

### Sandbox_no_network (Priority: 41)

**Given:**
- socket.connect(), etc.

**Result:** error returned

### Sandbox_allowed_functions (Priority: 42)

**Given:**
- `allowed_libs` (system) in `table,string,math,cjson`

**Then:**
- **emit_event** event: `script.stdlib_used`

**Result:** library functions execute normally

### Script_all_or_nothing (Priority: 50)

**Given:**
- script with multiple redis.call()
- `first_command_succeeds` (system) eq `true`
- `second_command_fails` (system) eq `true`

**Then:**
- **emit_event** event: `script.atomic_abort`

**Result:** first command's effects remain (NOT transactional); script aborted at failure

### Script_isolation (Priority: 51)

**Given:**
- script execution in progress
- `other_client_modifies_key` (system) eq `true`

**Then:**
- **emit_event** event: `script.isolation_maintained`

**Result:** script doesn't see other client's modification (changes applied after script completes)

## Errors

| Code | Status | Message | Retry |
|------|--------|---------|-------|
| `NOSCRIPT` |  | NOSCRIPT No matching script. Please use EVAL. | No |
| `SCRIPT_ERROR` |  | ERR Error running script: <details> | No |
| `SCRIPT_KILLED` |  | SCRIPT KILLED Script killed by user with SCRIPT KILL... | No |

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
| multi-exec-transactions | optional | Both provide atomicity; scripting is more powerful for complex logic |
| string-key-value | optional | Scripts often operate on string keys |

<details>
<summary><strong>Extensions (framework-specific hints)</strong></summary>

```yaml
source:
  repo: https://github.com/redis/redis
  project: Redis
  tech_stack: C
  files_traced: 3
  entry_points:
    - src/eval.c
    - src/script.c
    - src/script_lua.c
```

</details>


<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "Lua Scripting Blueprint",
  "description": "Server-side Lua script execution providing atomic operations, programmatic logic, and access to all Redis commands within a single round-trip. 7 fields. 21 outc",
  "programmingLanguage": "YAML",
  "codeRepository": "https://github.com/TheunsBarnardt/claude-fdl",
  "license": "https://opensource.org/licenses/MIT",
  "keywords": "lua-scripting, server-side-execution, atomic-operations, stored-procedures"
}
</script>
