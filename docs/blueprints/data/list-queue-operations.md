---
title: "List Queue Operations Blueprint"
layout: default
parent: "Data"
grand_parent: Blueprint Catalog
description: "Ordered collection with efficient head/tail insertion, removal, and range queries; supports blocking operations and atomic moves between lists. 7 fields. 23 out"
---

# List Queue Operations Blueprint

> Ordered collection with efficient head/tail insertion, removal, and range queries; supports blocking operations and atomic moves between lists

| | |
|---|---|
| **Feature** | `list-queue-operations` |
| **Category** | Data |
| **Version** | 1.0.0 |
| **Tags** | lists, queues, stacks, blocking-operations, ordered-collections |
| **YAML Source** | [View on GitHub](https://github.com/TheunsBarnardt/claude-fdl/blob/master/blueprints/data/list-queue-operations.blueprint.yaml) |
| **JSON API** | [list-queue-operations.json]({{ site.baseurl }}/api/blueprints/data/list-queue-operations.json) |

## Actors

| ID | Name | Type | Description |
|----|------|------|-------------|
| `client` | Client | human | Application requesting list operations |

## Fields

| Name | Type | Required | Label | Description |
|------|------|----------|-------|-------------|
| `key` | text | Yes |  |  |
| `elements` | json | No |  |  |
| `length` | number | No |  |  |
| `head_index` | number | No |  |  |
| `tail_index` | number | No |  |  |
| `is_blocking` | boolean | No |  |  |
| `block_timeout_ms` | number | No |  |  |

## States

**State field:** `undefined`

**Values:**

| State | Initial | Terminal |
|-------|---------|----------|

## Rules

- List can be accessed from both ends (head and tail) in O(1) time
- Indices support negative values (-1 = last element, -2 = second-to-last, etc.)
- LTRIM removes elements from both ends simultaneously; intermediate indices unclamped
- Blocking operations (BLPOP, BRPOP, etc.) suspend client until data available or timeout
- When list becomes empty after pop/trim, key is automatically deleted
- LMOVE and BLMOVE atomically pop from source and push to destination
- Range indices clamped to valid bounds; out-of-range ranges return empty results
- All operations are atomic with respect to individual keys

## Outcomes

### Push_to_head (Priority: 10)

**Given:**
- LPUSH command issued
- `elements` (input) eq

**Then:**
- **set_field** target: `elements` — add to head in order provided
- **emit_event** event: `list.lpush`

**Result:** list created if absent; elements added; client receives new length

### Push_to_tail (Priority: 11)

**Given:**
- RPUSH command issued
- `elements` (input) eq

**Then:**
- **set_field** target: `elements` — add to tail in order provided
- **emit_event** event: `list.rpush`

**Result:** list created if absent; elements added; client receives new length

### Push_conditional (Priority: 12)

**Given:**
- `command` (input) in `LPUSHX,RPUSHX`

**Then:**
- **set_field** target: `elements` when: `list exists`
- **emit_event** event: `list.push_conditional`

**Result:** elements added if list present; returns 0 if key absent

### Pop_from_head (Priority: 20)

**Given:**
- LPOP command issued
- `count` (input) gt `0`

**Then:**
- **set_field** target: `elements` — remove from head
- **emit_event** event: `list.lpop`

**Result:** client receives single element or array of count elements (or nil if empty)

### Pop_from_tail (Priority: 21)

**Given:**
- RPOP command issued
- `count` (input) gt `0`

**Then:**
- **set_field** target: `elements` — remove from tail
- **emit_event** event: `list.rpop`

**Result:** client receives single element or array of count elements (or nil if empty)

### Pop_empty_list (Priority: 22)

**Given:**
- `list_length` (db) eq `0`

**Then:**
- **emit_event** event: `list.pop_empty`

**Result:** client receives nil

### Blocking_pop (Priority: 23)

**Given:**
- `command` (input) in `BLPOP,BRPOP,BLMOVE,BLMPOP`
- `timeout_ms` (input) gte `0`
- `list_has_data` (db) eq `false`

**Then:**
- **transition_state** field: `blocking_state` to: `suspended` — client put in queue
- **emit_event** event: `list.blocking_wait`

**Result:** client blocks until data available or timeout; receives elements or nil

### Blocking_pop_timeout (Priority: 24)

**Given:**
- `timeout_elapsed` (system) eq `true`
- `no_data_arrived` (system) eq `true`

**Then:**
- **transition_state** field: `blocking_state` to: `released`
- **emit_event** event: `list.blocking_timeout`

**Result:** client unblocked; receives nil

### Get_range (Priority: 30)

**Given:**
- LRANGE key start stop
- `start` (input) eq
- `stop` (input) eq

**Then:**
- **emit_event** event: `list.range_read`

**Result:** array of elements from start to stop inclusive (clamped to bounds); empty array if out-of-range

### Get_index (Priority: 31)

**Given:**
- LINDEX key index
- `index` (input) eq

**Then:**
- **emit_event** event: `list.index_read`

**Result:** element at index (or nil if out-of-range)

### Get_length (Priority: 32)

**Given:**
- LLEN key

**Then:**
- **emit_event** event: `list.len`

**Result:** number of elements (0 if key absent)

### Set_index (Priority: 40)

**Given:**
- LSET key index element
- `index` (input) eq

**Then:**
- **set_field** target: `elements` — replace at index
- **emit_event** event: `list.set`

**Result:** element replaced; client receives OK

### Set_out_of_range (Priority: 41) — Error: `OUT_OF_RANGE`

**Given:**
- `index` (input) not_in `[valid_indices]`

**Result:** error returned; list unchanged

### Insert_element (Priority: 42)

**Given:**
- LINSERT key BEFORE|AFTER pivot element
- `pivot` (input) eq
- `pivot_found` (db) eq `true`

**Then:**
- **set_field** target: `elements` — insert before or after first matching pivot
- **emit_event** event: `list.insert`

**Result:** element inserted; client receives new length

### Insert_pivot_not_found (Priority: 43)

**Given:**
- `pivot_found` (db) eq `false`

**Then:**
- **emit_event** event: `list.insert_failed`

**Result:** list unchanged; client receives -1

### Trim_range (Priority: 44)

**Given:**
- LTRIM key start stop
- `start` (input) eq
- `stop` (input) eq

**Then:**
- **set_field** target: `elements` — remove elements outside [start, stop]
- **emit_event** event: `list.trimmed`

**Result:** list trimmed; client receives OK; key deleted if empty

### Remove_elements (Priority: 45)

**Given:**
- LREM key count element
- `count` (input) eq

**Then:**
- **set_field** target: `elements` — remove matching elements per count direction
- **emit_event** event: `list.removed`

**Result:** matching elements removed; client receives count removed

### Find_position (Priority: 46)

**Given:**
- LPOS key element [RANK rank] [COUNT count] [MAXLEN len]

**Then:**
- **emit_event** event: `list.pos_search`

**Result:** single position or array of positions (or nil if not found)

### Move_between_lists (Priority: 50)

**Given:**
- LMOVE source destination LEFT|RIGHT LEFT|RIGHT
- `source_has_data` (db) eq `true`

**Then:**
- **set_field** target: `source.elements` — pop from source
- **set_field** target: `destination.elements` — push to destination
- **emit_event** event: `list.moved`

**Result:** element moved atomically; client receives moved element

### Move_empty_source (Priority: 51)

**Given:**
- `source_has_data` (db) eq `false`

**Then:**
- **emit_event** event: `list.move_failed`

**Result:** lists unchanged; client receives nil

### Blocking_move (Priority: 52)

**Given:**
- `command` (input) eq `BLMOVE`
- `source_empty` (db) eq `true`
- `timeout_ms` (input) gte `0`

**Then:**
- **transition_state** field: `blocking_state` to: `suspended`
- **emit_event** event: `list.blocking_move`

**Result:** client blocks until source has data or timeout; then moves and returns element

### Mpop_from_multiple_keys (Priority: 60)

**Given:**
- LMPOP numkeys key [key ...] LEFT|RIGHT [COUNT count]
- `first_non_empty` (db) eq

**Then:**
- **set_field** target: `first_non_empty.elements` — pop count elements from this list
- **emit_event** event: `list.mpop`

**Result:** nested array [key, [elements...]] or nil if all empty

### Blocking_mpop (Priority: 61)

**Given:**
- `command` (input) eq `BLMPOP`
- `any_nonempty` (db) eq `false`

**Then:**
- **transition_state** field: `blocking_state` to: `suspended`
- **emit_event** event: `list.blocking_mpop`

**Result:** client blocks until any key has data or timeout; then pops and returns [key, elements]

## Errors

| Code | Status | Message | Retry |
|------|--------|---------|-------|
| `OUT_OF_RANGE` |  | index is out of range | No |
| `WRONG_TYPE` |  | WRONGTYPE Operation against a key holding the wrong kind of value | No |

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
| string-key-value | optional | Elements are strings or numeric values |
| multi-exec-transactions | optional | Often used within transactions |

<details>
<summary><strong>Extensions (framework-specific hints)</strong></summary>

```yaml
source:
  repo: https://github.com/redis/redis
  project: Redis
  tech_stack: C
  files_traced: 2
  entry_points:
    - src/t_list.c
    - src/quicklist.h
```

</details>


<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "List Queue Operations Blueprint",
  "description": "Ordered collection with efficient head/tail insertion, removal, and range queries; supports blocking operations and atomic moves between lists. 7 fields. 23 out",
  "programmingLanguage": "YAML",
  "codeRepository": "https://github.com/TheunsBarnardt/claude-fdl",
  "license": "https://opensource.org/licenses/MIT",
  "keywords": "lists, queues, stacks, blocking-operations, ordered-collections"
}
</script>
