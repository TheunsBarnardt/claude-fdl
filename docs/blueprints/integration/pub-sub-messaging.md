---
title: "Pub Sub Messaging Blueprint"
layout: default
parent: "Integration"
grand_parent: Blueprint Catalog
description: "Real-time fire-and-forget message broadcasting with direct channel subscriptions and pattern-based subscriptions; sharded variant for cluster deployments. 5 fie"
---

# Pub Sub Messaging Blueprint

> Real-time fire-and-forget message broadcasting with direct channel subscriptions and pattern-based subscriptions; sharded variant for cluster deployments

| | |
|---|---|
| **Feature** | `pub-sub-messaging` |
| **Category** | Integration |
| **Version** | 1.0.0 |
| **Tags** | pub-sub, real-time-messaging, broadcast, pattern-matching, no-persistence |
| **YAML Source** | [View on GitHub](https://github.com/TheunsBarnardt/claude-fdl/blob/master/blueprints/integration/pub-sub-messaging.blueprint.yaml) |
| **JSON API** | [pub-sub-messaging.json]({{ site.baseurl }}/api/blueprints/integration/pub-sub-messaging.json) |

## Actors

| ID | Name | Type | Description |
|----|------|------|-------------|
| `publisher` | Publisher | system | Sends messages to channels |
| `subscriber` | Subscriber | system | Receives messages from subscribed channels |
| `global_pubsub` | Global Pub/Sub | system | Global message broker (non-sharded) |
| `sharded_pubsub` | Sharded Pub/Sub | system | Per-shard message broker (cluster mode) |

## Fields

| Name | Type | Required | Label | Description |
|------|------|----------|-------|-------------|
| `channel_name` | text | Yes |  |  |
| `pattern` | text | No |  |  |
| `message` | text | No |  |  |
| `subscriber_count` | number | No |  |  |
| `pattern_subscriber_count` | number | No |  |  |

## States

**State field:** `undefined`

**Values:**

| State | Initial | Terminal |
|-------|---------|----------|

## Rules

- Messages are fire-and-forget (no persistence, no replay)
- Subscribers must be connected when message published to receive it
- Offline subscribers miss all messages published while disconnected
- No message ordering guarantee across multiple subscribers
- Subscriber enters "subscription mode" and can only use subscription commands
- Pattern subscriptions use glob matching (* = any, ? = single char, [abc] = set)
- Sharded pub/sub messages routed by slot (like hash sharding)
- Sharded pub/sub only reaches nodes owning the shard
- Subscriber can have multiple channel and pattern subscriptions
- Unsubscribe with empty list = unsubscribe from all

## Outcomes

### Publish_message (Priority: 10)

**Given:**
- PUBLISH channel message
- `channel` (input) eq
- `message` (input) eq

**Then:**
- **emit_event** event: `pubsub.message_published`

**Result:** client receives count of subscribers that received the message

### Publish_no_subscribers (Priority: 11)

**Given:**
- `subscriber_count` (db) eq `0`
- `pattern_subscriber_count` (db) eq `0`

**Then:**
- **emit_event** event: `pubsub.published_to_empty`

**Result:** message discarded; client receives 0

### Sharded_publish (Priority: 12)

**Given:**
- SPUBLISH shard_channel message
- `shard_owned_by_this_node` (system) eq `true`

**Then:**
- **emit_event** event: `pubsub.sharded_published`

**Result:** count of subscribers on this shard that received message

### Subscribe_to_channels (Priority: 20)

**Given:**
- SUBSCRIBE channel [channel ...]
- `channels` (input) eq

**Then:**
- **transition_state** field: `subscriber_state` to: `subscribed`
- **emit_event** event: `pubsub.subscribed`

**Result:** client enters subscription mode; receives subscription confirmation; starts receiving messages

### Subscribe_pattern (Priority: 21)

**Given:**
- PSUBSCRIBE pattern [pattern ...]
- `patterns` (input) eq

**Then:**
- **transition_state** field: `subscriber_state` to: `subscribed`
- **emit_event** event: `pubsub.pattern_subscribed`

**Result:** client enters subscription mode; receives pattern subscription confirmation

### Receive_message (Priority: 22)

**Given:**
- `message_published` (system) eq
- `subscriber_state` (db) eq `subscribed`

**Then:**
- **emit_event** event: `pubsub.message_received`

**Result:** message delivered to subscriber in format [type, channel/pattern, message]

### Receive_pattern_match (Priority: 23)

**Given:**
- `channel_matches_pattern` (system) eq `true`
- `pattern_subscribed` (db) eq `true`

**Then:**
- **emit_event** event: `pubsub.pattern_message_received`

**Result:** message delivered in format [ptype, pattern, channel, message]

### Sharded_subscribe (Priority: 24)

**Given:**
- SSUBSCRIBE shard_channel [shard_channel ...]

**Then:**
- **transition_state** field: `subscriber_state` to: `subscribed`
- **emit_event** event: `pubsub.sharded_subscribed`

**Result:** client enters subscription mode; receives shard channel confirmations

### Unsubscribe_from_channels (Priority: 30)

**Given:**
- UNSUBSCRIBE [channel ...]
- `channels` (input) eq

**Then:**
- **emit_event** event: `pubsub.unsubscribed`

**Result:** receives unsubscription confirmations; client exits subscription mode if no subscriptions remain

### Unsubscribe_from_patterns (Priority: 31)

**Given:**
- PUNSUBSCRIBE [pattern ...]
- `patterns` (input) eq

**Then:**
- **emit_event** event: `pubsub.pattern_unsubscribed`

**Result:** receives unsubscription confirmations; exits subscription mode if no subscriptions remain

### Exit_subscription_mode (Priority: 32)

**Given:**
- `remaining_subscriptions` (computed) eq `0`

**Then:**
- **transition_state** field: `subscriber_state` to: `not_subscribed`
- **emit_event** event: `pubsub.mode_exited`

**Result:** subscriber back in normal mode; can execute non-pub/sub commands

### Sharded_unsubscribe (Priority: 33)

**Given:**
- SUNSUBSCRIBE [shard_channel ...]

**Then:**
- **emit_event** event: `pubsub.sharded_unsubscribed`

**Result:** unsubscription confirmations

### Command_in_subscription_mode (Priority: 40) — Error: `SUBSCRIPTION_MODE`

**Given:**
- `subscriber_state` (db) eq `subscribed`
- `command` (input) not_in `SUBSCRIBE,PSUBSCRIBE,UNSUBSCRIBE,PUNSUBSCRIBE,PING,QUIT,HELLO,RESET`

**Then:**
- **emit_event** event: `pubsub.invalid_command`

**Result:** error returned; command not executed; subscription mode unchanged

### Ping_while_subscribed (Priority: 41)

**Given:**
- `subscriber_state` (db) eq `subscribed`
- PING [message]

**Then:**
- **emit_event** event: `pubsub.pong`

**Result:** [pong, message-or-nil]

### Pubsub_channels (Priority: 50)

**Given:**
- PUBSUB CHANNELS [pattern]
- `pattern` (input) eq

**Then:**
- **emit_event** event: `pubsub.channels_listed`

**Result:** array of active channel names (with subscribers)

### Pubsub_numsub (Priority: 51)

**Given:**
- PUBSUB NUMSUB channel [channel ...]

**Then:**
- **emit_event** event: `pubsub.numsub_queried`

**Result:** flattened array [channel1, count1, channel2, count2, ...]

### Pubsub_numpat (Priority: 52)

**Given:**
- PUBSUB NUMPAT

**Then:**
- **emit_event** event: `pubsub.numpat_queried`

**Result:** total count of pattern subscriptions across all clients

## Errors

| Code | Status | Message | Retry |
|------|--------|---------|-------|
| `SUBSCRIPTION_MODE` |  | only (P)SUBSCRIBE / (P)UNSUBSCRIBE / PING / QUIT allowed in this context | No |
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
| stream-event-log | optional | Both deliver messages; Pub/Sub is ephemeral, Streams are persistent |
| message-queue | optional | Pub/Sub is broadcast (no ack), message queues have ack and guaranteed delivery |

<details>
<summary><strong>Extensions (framework-specific hints)</strong></summary>

```yaml
source:
  repo: https://github.com/redis/redis
  project: Redis
  tech_stack: C
  files_traced: 1
  entry_points:
    - src/pubsub.c
```

</details>


<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "Pub Sub Messaging Blueprint",
  "description": "Real-time fire-and-forget message broadcasting with direct channel subscriptions and pattern-based subscriptions; sharded variant for cluster deployments. 5 fie",
  "programmingLanguage": "YAML",
  "codeRepository": "https://github.com/TheunsBarnardt/claude-fdl",
  "license": "https://opensource.org/licenses/MIT",
  "keywords": "pub-sub, real-time-messaging, broadcast, pattern-matching, no-persistence"
}
</script>
