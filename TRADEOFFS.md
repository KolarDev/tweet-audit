# Engineering Trade-offs

This document explains the architectural decisions made while building Tweet Audit, the trade-offs behind those decisions, and potential future improvements.

---

## Processing Strategy

### Decision

Tweets are processed sequentially.

```
Tweet

↓

Prompt

↓

Gemini

↓

CSV

↓

Next Tweet
```

### Why

The Gemini API has request limits, and processing sequentially simplifies error handling, retries, checkpointing, and logging.

### Trade-off

Pros

- Simple implementation
- Easy to reason about
- Predictable API usage
- Checkpointing is straightforward

Cons

- Lower throughput than concurrent processing

Future improvement

A worker-pool with configurable concurrency could increase throughput while respecting API rate limits.

---

## Retry Strategy

### Decision

Retries are implemented using exponential backoff.

Only transient failures are retried.

Examples

- Timeouts
- HTTP 429
- HTTP 503

Permanent failures such as invalid API keys or malformed responses fail immediately.

### Why

Retrying permanent failures wastes time and API quota.

### Trade-off

Pros

- More resilient
- Reduced API failures
- Reusable retry utility

Cons

- Slightly increases execution time during failures

Future improvement

Use exponential backoff with jitter to avoid synchronized retries.

---

## Checkpointing

### Decision

The processor saves its progress periodically and resumes from the latest checkpoint after interruption.

Stored information

- Last processed index
- Processing statistics
- Timestamp

### Why

Large archives may take hours to process.

Checkpointing prevents reprocessing tweets after crashes or API quota exhaustion.

### Trade-off

Pros

- Saves API costs
- Faster recovery
- Supports graceful shutdown

Cons

- Small disk write overhead

Future improvement

Checkpoint only after successful batches instead of fixed intervals.

---

## Rate Limiting

### Decision

Requests are throttled using a configurable rate limiter.

### Why

Respect API quotas and reduce the likelihood of HTTP 429 responses.

### Trade-off

Pros

- Predictable request rate
- Easier quota management

Cons

- Slower processing

Future improvement

Adaptive rate limiting based on API responses.

---

## Logging

### Decision

Structured logging is used instead of printing every processed tweet.

Logs are emitted for

- checkpoints
- retries
- failures
- final summary

### Why

Logging every tweet produces excessive output for large archives.

### Trade-off

Pros

- Cleaner console output
- Easier debugging
- Better production experience

Cons

- Individual successful tweets are not logged

Future improvement

Support multiple log levels and JSON logs.

---

## CSV Output

### Decision

Only the fields required by the assessment are written.

```
tweet_url
deleted
```

### Why

Avoid unnecessary data duplication.

### Trade-off

Pros

- Simpler output
- Smaller files

Cons

- Less information for future analysis

Future improvement

Support optional output formats such as JSON.

---

## Concurrency

### Decision

No parallel processing was implemented.

### Why

Sequential processing makes retries, checkpointing, and rate limiting significantly simpler.

### Trade-off

Pros

- Deterministic execution
- Simpler recovery
- Lower API pressure

Cons

- Slower for very large archives

Future improvement

Introduce a configurable worker pool with bounded concurrency.

---

## Memory Usage

### Current Implementation

The archive is fully loaded into memory before processing.

### Why

The X archive format stores tweets inside a JavaScript assignment rather than newline-delimited JSON, making true streaming difficult without a custom parser.

### Trade-off

Pros

- Simpler parser
- Easier implementation

Cons

- Higher memory usage for very large archives

Future improvement

Replace the parser with a streaming implementation that yields tweets lazily.

---

## Future Improvements

If this project were extended beyond the assessment, I would prioritise:

- Streaming archive parsing
- Worker-pool concurrency
- Batch Gemini requests
- Adaptive rate limiting
- Exponential backoff with jitter
- Metrics collection
- Progress bars
- Persistent structured logging
- Multiple output formats