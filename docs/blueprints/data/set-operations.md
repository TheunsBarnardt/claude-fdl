---
title: "Set Operations Blueprint"
layout: default
parent: "Data"
grand_parent: Blueprint Catalog
description: "Unordered collection of unique elements with set algebra operations (union, intersection, difference) and cardinality counting. 4 fields. 17 outcomes. 1 error c"
---

# Set Operations Blueprint

> Unordered collection of unique elements with set algebra operations (union, intersection, difference) and cardinality counting

| | |
|---|---|
| **Feature** | `set-operations` |
| **Category** | Data |
| **Version** | 1.0.0 |
| **Tags** | sets, unordered-collections, set-algebra, cardinality |
| **YAML Source** | [View on GitHub](https://github.com/TheunsBarnardt/claude-fdl/blob/master/blueprints/data/set-operations.blueprint.yaml) |
| **JSON API** | [set-operations.json]({{ site.baseurl }}/api/blueprints/data/set-operations.json) |

## Actors

| ID | Name | Type | Description |
|----|------|------|-------------|
| `client` | Client | human | Application requesting set operations |

## Fields

| Name | Type | Required | Label | Description |
|------|------|----------|-------|-------------|
| `key` | text | Yes |  |  |
| `members` | json | No |  |  |
| `cardinality` | number | No |  |  |
| `destination_key` | text | No |  |  |

## States

**State field:** `undefined`

**Values:**

| State | Initial | Terminal |
|-------|---------|----------|

## Rules

- Set elements are unique; adding duplicate element replaces (no effect on cardinality)
- Set membership is unordered (no indices or ranges)
- Set algebra operations (intersection, union, difference) can accept multiple source sets
- Intersection of multiple sets returns elements present in ALL sets
- Union of multiple sets returns elements present in ANY set
- Difference of first set minus others returns elements in first but not in any other
- Store variants (*STORE) create destination set atomically; overwrite if exists
- All operations are atomic with respect to individual keys

## Outcomes

### Add_members (Priority: 10)

**Given:**
- SADD key member [member ...]
- `members_to_add` (input) eq

**Then:**
- **set_field** target: `members` — add new members (duplicates ignored)
- **set_field** target: `cardinality` — increment by count of new members
- **emit_event** event: `set.added`

**Result:** set created if absent; members added; client receives count of newly added members

### Remove_members (Priority: 11)

**Given:**
- SREM key member [member ...]
- `members_to_remove` (input) eq

**Then:**
- **set_field** target: `members` — remove specified members
- **set_field** target: `cardinality` — decrement by count of removed members
- **emit_event** event: `set.removed`

**Result:** members removed; client receives count of removed members; set deleted if empty

### Get_all_members (Priority: 20)

**Given:**
- SMEMBERS key

**Then:**
- **emit_event** event: `set.members_read`

**Result:** unordered array of all members (empty if set absent)

### Check_membership (Priority: 21)

**Given:**
- SISMEMBER key member
- `member` (input) eq

**Then:**
- **emit_event** event: `set.ismember_check`

**Result:** 1 if member present, 0 if not

### Check_multiple_membership (Priority: 22)

**Given:**
- SMISMEMBER key member [member ...]
- `members_to_check` (input) eq

**Then:**
- **emit_event** event: `set.mismember_check`

**Result:** array of 0/1 for each member (1=member present, 0=absent)

### Get_cardinality (Priority: 23)

**Given:**
- SCARD key

**Then:**
- **emit_event** event: `set.cardinality`

**Result:** number of members (0 if key absent)

### Random_members (Priority: 24)

**Given:**
- SRANDMEMBER key [count]
- `count` (input) eq

**Then:**
- **emit_event** event: `set.random_draw`

**Result:** single member or array of members (may have duplicates if count > cardinality)

### Pop_random (Priority: 25)

**Given:**
- SPOP key [count]
- `count` (input) eq

**Then:**
- **set_field** target: `members` — remove random members
- **set_field** target: `cardinality` — decrement by count removed
- **emit_event** event: `set.popped`

**Result:** single member or array of members removed (no duplicates); nil if empty

### Move_between_sets (Priority: 26)

**Given:**
- SMOVE source destination member
- `member_in_source` (db) eq `true`

**Then:**
- **set_field** target: `source.members` — remove from source
- **set_field** target: `destination.members` — add to destination
- **emit_event** event: `set.moved`

**Result:** member moved; client receives 1 (or 0 if already in destination)

### Intersection (Priority: 30)

**Given:**
- SINTER key [key ...]
- `input_sets` (input) eq

**Then:**
- **emit_event** event: `set.intersection`

**Result:** array of elements in ALL sets (empty if no common elements)

### Intersection_store (Priority: 31)

**Given:**
- SINTERSTORE destination key [key ...]
- `destination` (input) eq

**Then:**
- **set_field** target: `destination.members` — set to intersection result
- **emit_event** event: `set.intersection_stored`

**Result:** destination set created/overwritten; client receives cardinality of result

### Intersection_cardinality (Priority: 32)

**Given:**
- SINTERCARD numkeys key [key ...] [LIMIT limit]
- `limit` (input) eq

**Then:**
- **emit_event** event: `set.intercard`

**Result:** cardinality of intersection (limited by LIMIT if provided)

### Union (Priority: 33)

**Given:**
- SUNION key [key ...]

**Then:**
- **emit_event** event: `set.union`

**Result:** array of unique elements across all sets

### Union_store (Priority: 34)

**Given:**
- SUNIONSTORE destination key [key ...]

**Then:**
- **set_field** target: `destination.members` — set to union result
- **emit_event** event: `set.union_stored`

**Result:** destination set created/overwritten; client receives cardinality

### Difference (Priority: 35)

**Given:**
- SDIFF key [key ...]
- `first_key` (input) eq
- `other_keys` (input) eq

**Then:**
- **emit_event** event: `set.difference`

**Result:** array of elements in first set minus all others

### Difference_store (Priority: 36)

**Given:**
- SDIFFSTORE destination key [key ...]

**Then:**
- **set_field** target: `destination.members` — set to difference result
- **emit_event** event: `set.difference_stored`

**Result:** destination set created/overwritten; client receives cardinality

### Scan_members (Priority: 40)

**Given:**
- SSCAN key cursor [MATCH pattern] [COUNT count]
- `cursor` (input) eq

**Then:**
- **emit_event** event: `set.scan`

**Result:** array [new_cursor, [members...]] (cursor=0 when full scan complete)

## Errors

| Code | Status | Message | Retry |
|------|--------|---------|-------|
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

## Related Blueprints

| Feature | Relationship | Reason |
|---------|-------------|--------|
| string-key-value | optional | Elements are strings or numeric values |
| sorted-set-operations | optional | Sorted sets extend sets with scoring |

<details>
<summary><strong>Extensions (framework-specific hints)</strong></summary>

```yaml
source:
  repo: https://github.com/redis/redis
  project: Redis
  tech_stack: C
  files_traced: 1
  entry_points:
    - src/t_set.c
```

</details>


<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "Set Operations Blueprint",
  "description": "Unordered collection of unique elements with set algebra operations (union, intersection, difference) and cardinality counting. 4 fields. 17 outcomes. 1 error c",
  "programmingLanguage": "YAML",
  "codeRepository": "https://github.com/TheunsBarnardt/claude-fdl",
  "license": "https://opensource.org/licenses/MIT",
  "keywords": "sets, unordered-collections, set-algebra, cardinality"
}
</script>
