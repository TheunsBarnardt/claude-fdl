---
title: "String Key Value Blueprint"
layout: default
parent: "Data"
grand_parent: Blueprint Catalog
description: "Store and retrieve arbitrary-length string values with atomic increment, decrement, append, and range operations. 6 fields. 22 outcomes. 6 error codes. rules: 0"
---

# String Key Value Blueprint

> Store and retrieve arbitrary-length string values with atomic increment, decrement, append, and range operations

| | |
|---|---|
| **Feature** | `string-key-value` |
| **Category** | Data |
| **Version** | 1.0.0 |
| **Tags** | strings, key-value, atomic-operations, numeric-operations |
| **YAML Source** | [View on GitHub](https://github.com/TheunsBarnardt/claude-fdl/blob/master/blueprints/data/string-key-value.blueprint.yaml) |
| **JSON API** | [string-key-value.json]({{ site.baseurl }}/api/blueprints/data/string-key-value.json) |

## Actors

| ID | Name | Type | Description |
|----|------|------|-------------|
| `client` | Client | human | Application requesting string operations |

## Fields

| Name | Type | Required | Label | Description |
|------|------|----------|-------|-------------|
| `key` | text | Yes |  |  |
| `value` | text | No |  |  |
| `ttl_milliseconds` | number | No |  |  |
| `is_numeric` | boolean | No |  |  |
| `old_value` | text | No |  |  |
| `encoding` | select | No |  |  |

## States

**State field:** `undefined`

**Values:**

| State | Initial | Terminal |
|-------|---------|----------|

## Rules

- String size cannot exceed 512 MB (configurable via proto_max_bulk_len)
- Numeric operations (INCR, DECR) require value to be a valid 64-bit signed integer; otherwise fail with syntax error
- Increment/decrement values must fit in [-2^63, 2^63-1]; overflow checked and rejected with error
- Floating-point increment (INCRBYFLOAT) parsed as long double; operations returning NaN or Infinity fail
- APPEND and SETRANGE extend string with zero-padding if needed; SETRANGE with negative offset rejected
- All operations are atomic—no partial states visible to concurrent clients
- SET with NX (if-not-exists) and XX (if-exists) conditions are mutually exclusive

## Outcomes

### Read_existing_string (Priority: 1)

**Given:**
- key exists and has string value
- key is not expired

**Then:**
- **emit_event** event: `string.read`

**Result:** client receives full string value

### Read_missing_key (Priority: 2)

**Given:**
- key does not exist

**Then:**
- **emit_event** event: `string.miss`

**Result:** client receives null/nil

### Read_with_ttl_modification (Priority: 3)

**Given:**
- key exists with string value
- GETEX command with optional expiry flags

**Then:**
- **set_field** target: `ttl_milliseconds` when: `EX|PX|EXAT|PXAT flag provided` — set new TTL on read
- **set_field** target: `ttl_milliseconds` value: `null` when: `PERSIST flag provided` — remove TTL on read
- **emit_event** event: `string.getex`

**Result:** client receives string value; TTL optionally modified

### Set_or_overwrite (Priority: 10)

**Given:**
- SET command issued

**Then:**
- **set_field** target: `value` — store new value
- **set_field** target: `ttl_milliseconds` value: `null` when: `no KEEPTTL flag` — discard old TTL unless KEEPTTL
- **set_field** target: `is_numeric` — evaluate if value parseable as integer for optimization
- **emit_event** event: `string.set`

**Result:** key now holds new value; client receives OK

### Set_with_conditions (Priority: 11)

**Given:**
- `condition_type` (input) in `NX,XX,IFEQ,IFNE,IFDEQ,IFDNE`
- `condition_met` (computed) eq `true`

**Then:**
- **set_field** target: `value` — store new value
- **emit_event** event: `string.set_conditional`

**Result:** value set and OK returned; or nil if condition not met

### Set_with_ttl (Priority: 12)

**Given:**
- SET with EX|PX|EXAT|PXAT flag

**Then:**
- **set_field** target: `value`
- **set_field** target: `ttl_milliseconds` — calculate absolute expiration time
- **emit_event** event: `string.set_expiring`

**Result:** key set with expiration; expires at specified time

### Conditional_set_fails (Priority: 13) — Error: `CONDITION_NOT_MET`

**Given:**
- SET with NX|XX|IFEQ|IFNE condition
- `condition_met` (computed) eq `false`

**Then:**
- **emit_event** event: `string.set_rejected`

**Result:** value unchanged; client receives nil

### Append_to_string (Priority: 20)

**Given:**
- APPEND command
- `value` (input) eq

**Then:**
- **set_field** target: `value` — concatenate suffix to end
- **emit_event** event: `string.appended`

**Result:** string extended; client receives new total length

### Get_substring (Priority: 21)

**Given:**
- GETRANGE key start end
- `start` (input) gte `-2^31`
- `end` (input) lte `2^31-1`

**Then:**
- **emit_event** event: `string.range_read`

**Result:** substring from start to end inclusive (0-indexed, supports negative indices); empty string if range out of bounds

### Set_substring (Priority: 22)

**Given:**
- SETRANGE key offset value
- `offset` (input) gte `0`

**Then:**
- **set_field** target: `value` — overwrite starting at offset; zero-pad if needed
- **emit_event** event: `string.range_written`

**Result:** string modified; client receives new total length

### Setrange_with_invalid_offset (Priority: 23) — Error: `INVALID_OFFSET`

**Given:**
- SETRANGE with negative offset

**Result:** error returned; string unchanged

### Increment_integer (Priority: 30)

**Given:**
- INCR, INCRBY, or DECR command
- `value` (db) matches `^-?[0-9]{1,19}$`
- `increment_amount` (computed) eq

**Then:**
- **set_field** target: `value` — increment or decrement value
- **emit_event** event: `string.incr`

**Result:** client receives new numeric value

### Increment_non_numeric (Priority: 31) — Error: `NOT_AN_INTEGER`

**Given:**
- `value` (db) not_matches `^-?[0-9]{1,19}$`

**Result:** error returned; value unchanged

### Increment_overflow (Priority: 32) — Error: `INCREMENT_OVERFLOW`

**Given:**
- `would_overflow` (computed) eq `true`

**Result:** error returned; value unchanged

### Increment_float (Priority: 33)

**Given:**
- INCRBYFLOAT command
- `value` (db) eq
- `result` (computed) not_in `NaN,Infinity`

**Then:**
- **set_field** target: `value` — increment by float; store as formatted decimal string
- **emit_event** event: `string.incrbyfloat`

**Result:** client receives new value as decimal string

### Increment_float_invalid (Priority: 34) — Error: `FLOAT_INVALID`

**Given:**
- `result` (computed) in `NaN,Infinity`

**Result:** error returned; value unchanged

### Getset_atomically (Priority: 40)

**Given:**
- GETSET or SET with GET flag

**Then:**
- **emit_event** event: `string.getset`

**Result:** old value returned to client; new value now stored

### Getdel_atomically (Priority: 41)

**Given:**
- GETDEL command

**Then:**
- **emit_event** event: `string.getdel`
- **transition_state** field: `existence` from: `present` to: `absent`

**Result:** value returned to client; key deleted

### Mget_multiple_keys (Priority: 50)

**Given:**
- MGET key1 [key2 ...]

**Then:**
- **emit_event** event: `string.mget`

**Result:** array returned with value for each key (nil for missing or non-string keys)

### Mset_multiple_keys (Priority: 51)

**Given:**
- MSET key1 value1 [key2 value2 ...]

**Then:**
- **emit_event** event: `string.mset`

**Result:** all keys set; client receives OK

### Msetnx_conditional_bulk (Priority: 52)

**Given:**
- MSETNX key1 value1 [key2 value2 ...]
- `all_keys_absent` (db) eq `true`

**Then:**
- **emit_event** event: `string.msetnx_success`

**Result:** all keys set; client receives 1

### Msetnx_condition_fails (Priority: 53) — Error: `KEY_EXISTS`

**Given:**
- `all_keys_absent` (db) eq `false`

**Then:**
- **emit_event** event: `string.msetnx_rejected`

**Result:** no keys set; client receives 0

## Errors

| Code | Status | Message | Retry |
|------|--------|---------|-------|
| `NOT_AN_INTEGER` |  | value is not an integer or out of range | No |
| `INCREMENT_OVERFLOW` |  | increment or decrement would overflow | No |
| `CONDITION_NOT_MET` |  | SET condition not met (returned as nil, not error) | No |
| `INVALID_OFFSET` |  | offset is out of range | No |
| `STRING_TOO_LARGE` |  | string exceeds maximum allowed size | No |
| `FLOAT_INVALID` |  | float increment resulted in NaN or Infinity | No |

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
| key-expiration | required | TTL support integrated into string operations |
| multi-exec-transactions | optional | Multiple string commands often wrapped in transactions |

<details>
<summary><strong>Extensions (framework-specific hints)</strong></summary>

```yaml
source:
  repo: https://github.com/redis/redis
  project: Redis
  tech_stack: C
  files_traced: 2
  entry_points:
    - src/t_string.c
    - src/server.c
```

</details>


<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "String Key Value Blueprint",
  "description": "Store and retrieve arbitrary-length string values with atomic increment, decrement, append, and range operations. 6 fields. 22 outcomes. 6 error codes. rules: 0",
  "programmingLanguage": "YAML",
  "codeRepository": "https://github.com/TheunsBarnardt/claude-fdl",
  "license": "https://opensource.org/licenses/MIT",
  "keywords": "strings, key-value, atomic-operations, numeric-operations"
}
</script>
