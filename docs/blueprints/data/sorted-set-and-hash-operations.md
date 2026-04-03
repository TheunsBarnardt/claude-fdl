---
title: "Sorted Set And Hash Operations Blueprint"
layout: default
parent: "Data"
grand_parent: Blueprint Catalog
description: "Sorted collections with ranking and scoring; nested key-value maps with field-level operations and optional TTL per field. 5 fields. 27 outcomes. 3 error codes."
---

# Sorted Set And Hash Operations Blueprint

> Sorted collections with ranking and scoring; nested key-value maps with field-level operations and optional TTL per field

| | |
|---|---|
| **Feature** | `sorted-set-and-hash-operations` |
| **Category** | Data |
| **Version** | 1.0.0 |
| **Tags** | sorted-sets, hashes, nested-kv, scoring, field-expiration, ranking |
| **YAML Source** | [View on GitHub](https://github.com/TheunsBarnardt/claude-fdl/blob/master/blueprints/data/sorted-set-and-hash-operations.blueprint.yaml) |
| **JSON API** | [sorted-set-and-hash-operations.json]({{ site.baseurl }}/api/blueprints/data/sorted-set-and-hash-operations.json) |

## Actors

| ID | Name | Type | Description |
|----|------|------|-------------|
| `client` | Client | human | Application requesting sorted set or hash operations |

## Fields

| Name | Type | Required | Label | Description |
|------|------|----------|-------|-------------|
| `key` | text | Yes |  |  |
| `members` | json | No |  |  |
| `fields` | json | No |  |  |
| `score` | number | No |  |  |
| `field_ttl_ms` | number | No |  |  |

## States

**State field:** `undefined`

**Values:**

| State | Initial | Terminal |
|-------|---------|----------|

## Rules

- Sorted set members are unique; adding existing member updates score
- Scores can be equal; ties broken by lexicographic member order
- Scores can be negative, infinity (-inf), or +inf
- Range queries support inclusive and exclusive boundaries
- Rank is 0-based (0 = lowest score, -1 = highest score in reverse)
- Lex ranges require all members to have identical scores
- Hash fields are unique strings; updating field overwrites value
- Hash supports per-field TTL (field expires independently)
- Numeric field operations (HINCRBY) increment field values
- Fields are unordered unless scanning with HSCAN

## Outcomes

### Zadd_members (Priority: 10)

**Given:**
- `command` (input) eq `ZADD`
- `nx_xx_compat` (input) not_in `NX+XX`

**Then:**
- **set_field** target: `members` — add new members or update scores
- **emit_event** event: `zset.added`

**Result:** new member count or changed count (with CH flag); client receives count

### Zadd_incr (Priority: 11)

**Given:**
- `incr_flag` (input) eq `INCR`

**Then:**
- **set_field** target: `members` — increment score (create if missing)
- **emit_event** event: `zset.scored`

**Result:** new score returned (as string)

### Zadd_conditional (Priority: 12)

**Given:**
- `condition` (input) in `NX,XX,GT,LT`
- `condition_met` (computed) eq `true`

**Then:**
- **set_field** target: `members`
- **emit_event** event: `zset.conditional_add`

**Result:** member added/updated if condition met; client receives count

### Zrem_members (Priority: 13)

**Given:**
- ZREM key member [member ...]

**Then:**
- **set_field** target: `members` — remove specified members
- **emit_event** event: `zset.removed`

**Result:** client receives count of removed members

### Zrange_by_rank (Priority: 20)

**Given:**
- ZRANGE key start stop [WITHSCORES]
- `range_type` (input) eq `rank`

**Then:**
- **emit_event** event: `zset.range_rank`

**Result:** array of members (with scores if WITHSCORES); empty if out-of-range

### Zrange_by_score (Priority: 21)

**Given:**
- ZRANGE key min max BYSCORE [WITHSCORES] [LIMIT offset count]
- `min_score` (input) eq
- `max_score` (input) eq

**Then:**
- **emit_event** event: `zset.range_score`

**Result:** array of members in score range [min, max] (exclusive with '(' prefix; handles -inf/+inf)

### Zrange_by_lex (Priority: 22)

**Given:**
- ZRANGE key min max BYLEX [LIMIT offset count]
- `all_equal_scores` (db) eq `true`

**Then:**
- **emit_event** event: `zset.range_lex`

**Result:** array of members in lex range [min, max] (exclusive with '(' prefix; handles -/+)

### Zrank_member (Priority: 23)

**Given:**
- ZRANK key member [WITHSCORE]

**Then:**
- **emit_event** event: `zset.rank`

**Result:** 0-based rank (or nil if member absent); score included if WITHSCORE

### Zscore_member (Priority: 24)

**Given:**
- ZSCORE key member

**Then:**
- **emit_event** event: `zset.score_read`

**Result:** score as string (or nil if member absent)

### Zinter_sets (Priority: 30)

**Given:**
- ZINTER numkeys key [key ...] [WEIGHTS weight ...] [AGGREGATE SUM|MIN|MAX]
- `weights` (input) eq
- `aggregate` (input) eq

**Then:**
- **emit_event** event: `zset.inter`

**Result:** array of members in all sets (scores combined per AGGREGATE)

### Zunion_sets (Priority: 31)

**Given:**
- ZUNION numkeys key [key ...] [WEIGHTS weight ...] [AGGREGATE SUM|MIN|MAX]

**Then:**
- **emit_event** event: `zset.union`

**Result:** array of members in any set (scores combined per AGGREGATE)

### Hset_fields (Priority: 40)

**Given:**
- `command` (input) in `HSET,HMSET`
- `field_value_pairs` (input) eq

**Then:**
- **set_field** target: `fields` — set or update fields
- **emit_event** event: `hash.set`

**Result:** count of new fields added (HSET) or OK (HMSET)

### Hget_field (Priority: 41)

**Given:**
- HGET key field

**Then:**
- **emit_event** event: `hash.field_read`

**Result:** field value (or nil if field absent or expired)

### Hmget_fields (Priority: 42)

**Given:**
- HMGET key field [field ...]

**Then:**
- **emit_event** event: `hash.multi_read`

**Result:** array with value for each field (nil for missing/expired fields)

### Hgetall_fields (Priority: 43)

**Given:**
- HGETALL key

**Then:**
- **emit_event** event: `hash.all_read`

**Result:** flattened array [field1, value1, field2, value2, ...] (excludes expired fields)

### Hkeys_fields (Priority: 44)

**Given:**
- HKEYS key

**Then:**
- **emit_event** event: `hash.keys_read`

**Result:** array of all field names (excludes expired)

### Hvals_values (Priority: 45)

**Given:**
- HVALS key

**Then:**
- **emit_event** event: `hash.vals_read`

**Result:** array of all values (excludes expired fields)

### Hdel_fields (Priority: 46)

**Given:**
- HDEL key field [field ...]

**Then:**
- **set_field** target: `fields` — remove specified fields
- **emit_event** event: `hash.deleted`

**Result:** count of deleted fields; hash deleted if empty

### Hincrby_field (Priority: 47)

**Given:**
- HINCRBY key field increment
- `value` (db) matches `^-?[0-9]+$`

**Then:**
- **set_field** target: `fields` — increment field (create if absent)
- **emit_event** event: `hash.incr`

**Result:** new field value after increment

### Hincrbyfloat_field (Priority: 48)

**Given:**
- HINCRBYFLOAT key field increment

**Then:**
- **set_field** target: `fields` — increment field by float
- **emit_event** event: `hash.incrbyfloat`

**Result:** new field value as decimal string

### Hexists_field (Priority: 49)

**Given:**
- HEXISTS key field

**Then:**
- **emit_event** event: `hash.exists_check`

**Result:** 1 if field exists and not expired, 0 otherwise

### Hlen_hash (Priority: 50)

**Given:**
- HLEN key

**Then:**
- **emit_event** event: `hash.count`

**Result:** number of fields (after lazy-expiring expired fields)

### Hexpire_field (Priority: 60)

**Given:**
- HEXPIRE key [NX|XX|GT|LT] seconds FIELDS count field [field ...]
- `condition` (input) eq

**Then:**
- **set_field** target: `field_ttl_ms` — set absolute expiration timestamp
- **emit_event** event: `hash.expire_set`

**Result:** array with count of affected fields per condition

### Hpexpire_field (Priority: 61)

**Given:**
- HPEXPIRE key [condition] milliseconds FIELDS count field [field ...]

**Then:**
- **set_field** target: `field_ttl_ms` — set absolute expiration (milliseconds precision)
- **emit_event** event: `hash.pexpire_set`

**Result:** array with affected field counts

### Hpersist_field (Priority: 62)

**Given:**
- HPERSIST key FIELDS count field [field ...]

**Then:**
- **set_field** target: `field_ttl_ms` value: `null` — remove TTL
- **emit_event** event: `hash.persist`

**Result:** array with count of fields that had TTL removed

### Httl_field (Priority: 63)

**Given:**
- HTTL key field [field ...]

**Then:**
- **emit_event** event: `hash.ttl_read`

**Result:** array of TTLs in seconds (-1=no-ttl, -2=field-absent)

### Hscan_fields (Priority: 70)

**Given:**
- HSCAN key cursor [MATCH pattern] [COUNT count]

**Then:**
- **emit_event** event: `hash.scan`

**Result:** array [new_cursor, [field1, value1, field2, value2, ...]]

## Errors

| Code | Status | Message | Retry |
|------|--------|---------|-------|
| `NOT_AN_INTEGER` |  | hash value is not an integer | No |
| `WRONG_TYPE` |  | WRONGTYPE Operation against a key holding the wrong kind of value | No |
| `SYNTAX_ERROR` |  | syntax error in score or condition | No |

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
| `undefined` |  |  |
| `undefined` |  |  |
| `undefined` |  |  |
| `undefined` |  |  |
| `undefined` |  |  |
| `undefined` |  |  |

## Related Blueprints

| Feature | Relationship | Reason |
|---------|-------------|--------|
| string-key-value | optional | Hash fields and sorted set members are strings |
| key-expiration | required | Hashes support per-field TTL |

<details>
<summary><strong>Extensions (framework-specific hints)</strong></summary>

```yaml
source:
  repo: https://github.com/redis/redis
  project: Redis
  tech_stack: C
  files_traced: 2
  entry_points:
    - src/t_zset.c
    - src/t_hash.c
```

</details>


<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "Sorted Set And Hash Operations Blueprint",
  "description": "Sorted collections with ranking and scoring; nested key-value maps with field-level operations and optional TTL per field. 5 fields. 27 outcomes. 3 error codes.",
  "programmingLanguage": "YAML",
  "codeRepository": "https://github.com/TheunsBarnardt/claude-fdl",
  "license": "https://opensource.org/licenses/MIT",
  "keywords": "sorted-sets, hashes, nested-kv, scoring, field-expiration, ranking"
}
</script>
