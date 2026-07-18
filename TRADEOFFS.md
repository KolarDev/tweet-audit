# Engineering Trade-offs

Building this project wasn't just about making it work.

I wanted to build it the way I would build a production service: making deliberate engineering decisions, accepting trade-offs, and documenting why those decisions were made.

---

# 1. Sequential Processing vs Concurrency

## Initial idea

The obvious way to make this project faster would have been to process multiple tweets simultaneously.

```
Tweet 1 ──┐
Tweet 2 ──┼── Gemini
Tweet 3 ──┤
Tweet 4 ──┘
```

More requests at once means better throughput.

---

## Why I didn't choose it

This project depends almost entirely on an external AI service.

The bottleneck isn't my CPU.

The bottleneck is Gemini.

Sending many requests concurrently would quickly increase the chances of:

* hitting API rate limits
* exhausting quota faster
* receiving HTTP 429 responses
* creating unnecessary retry storms

Concurrency would make the code faster under ideal conditions, but less reliable for long-running jobs.

---

## What I chose

I process tweets sequentially.

```
Tweet

↓

Gemini

↓

Write CSV

↓

Checkpoint (when interval is reached)

↓

Next Tweet
```

Every tweet completes before the next one starts.

---

## Why

I preferred predictable progress over maximum throughput.

Because processing is sequential:

* checkpointing is straightforward
* retries stay isolated
* failures affect only one tweet
* logs remain readable
* resuming work is deterministic

If I later wanted higher throughput, I could introduce worker pools with bounded concurrency, but for this project reliability mattered more than raw speed.

---

# 2. Retry Strategy

## Initial implementation

The first retry implementation simply waited for a fixed amount of time before retrying.

```
1 second

↓

Retry

↓

1 second

↓

Retry
```

It worked, but every retry happened at exactly the same interval.

---

## Why I changed it

Imagine thousands of clients all experiencing the same temporary outage.

If every client retries after exactly one second, they all hit the API again simultaneously.

That creates another traffic spike instead of giving the service room to recover.

This problem is commonly known as the **thundering herd problem**.

---

## Final approach

I switched to **exponential backoff with jitter**.

The delay grows after each failed attempt, but also includes randomness.

Instead of retrying like this:

```
1000ms
2000ms
4000ms
```

the delays become something more like:

```
742ms
1874ms
3561ms
```

Each retry is:

* exponentially larger than the previous one
* capped with a configurable maximum delay
* randomized using jitter

This spreads retries across time instead of sending them all at once.

The retry utility is also reusable because it accepts:

* maximum attempts
* base delay
* maximum delay
* retry decision callback
* logger

instead of hardcoding those values.

---

# 3. Checkpointing

## Initial implementation

Initially, if the application stopped halfway through processing, the only option was:

```
Restart

↓

Begin from tweet 1
```

For an AI-powered application, this quickly becomes expensive because every repeated tweet means another API request.

---

## Why this is a problem

Suppose I have:

* 20,000 tweets

and Gemini allows roughly:

* 1,000 requests

before hitting quota.

Without checkpointing:

Day 1

```
Tweets 1 → 1000
```

Quota exhausted.

Day 2

```
Tweets 1 → 1000
```

Again.

The audit would never reach tweet 1001.

---

## Final approach

Instead of only storing the final result, I periodically save progress into a checkpoint file.

The checkpoint stores:

* last processed index
* processed count
* flagged count
* failed count
* timestamp

One important design decision was making checkpoint frequency configurable.

For example:

```
Checkpoint every 10 tweets
```

or

```
Checkpoint every 25 tweets
```

or

```
Checkpoint every 100 tweets
```

This lets me balance two competing concerns.

A smaller interval:

* loses less work after interruption
* performs more disk writes

A larger interval:

* performs fewer writes
* may require reprocessing more tweets after restarting

Rather than hardcoding one behaviour, I made the interval configurable.

---

## Resume behaviour

The application resumes from the **last saved checkpoint**, not necessarily the exact tweet where execution stopped.

For example, if checkpoints are saved every 25 tweets:

```
Checkpoint → Tweet 100

↓

Process Tweet 101...

↓

Process Tweet 118...

↓

Laptop dies
```

The application resumes from:

```
Tweet 101
```

meaning tweets 101–118 are processed again.

I accepted this trade-off because repeating a few tweets is significantly simpler than constantly writing checkpoints after every single operation.

---

# 4. Graceful Shutdown

Periodic checkpointing alone still leaves one problem.

If the application is interrupted before reaching the next checkpoint interval, recent work would normally be lost.

---

## Final approach

The application listens for shutdown signals.

```
Ctrl + C

↓

SIGINT

↓

Save latest checkpoint

↓

Exit
```

Instead of terminating immediately, it first attempts to save the current checkpoint before shutting down.

This significantly reduces duplicated work while keeping shutdown logic simple.

---

# 5. Rate Limiting

Initially every request was sent immediately.

```
Tweet

↓

Gemini

↓

Next

↓

Next
```

This worked with the mock client and very small datasets.

For a real AI provider, however, sending requests as fast as possible isn't always the best strategy.

---

## Why I added a rate limiter

External AI services usually enforce request limits.

Aggressive request rates increase the chances of:

* HTTP 429 responses
* temporary throttling
* unnecessary retries

Instead of depending entirely on retries, I chose to reduce the likelihood of hitting limits in the first place.

---

## Final approach

Before each AI request:

```
wait()

↓

Gemini

↓

Continue
```

The delay is configurable, making it easy to tune depending on:

* free-tier limits
* paid plans
* different AI providers
* future deployment environments

This makes the application slower, but significantly more predictable during long-running audits.

---

# 6. Loading the Archive

The parser currently reads the entire X archive into memory before processing.

```
tweets.js

↓

Read file

↓

Parse JSON

↓

Process tweets
```

---

## Why I kept it

For my archive (roughly five thousand tweets), memory usage is completely acceptable.

Keeping everything in memory also simplifies:

* checkpointing
* indexing
* processing logic
* testing

---

## Future improvement

If this project needed to process hundreds of thousands or even millions of tweets, I would redesign the parser to stream data instead.

```
Read file

↓

Yield one tweet

↓

Process

↓

Yield next tweet
```

Streaming would dramatically reduce memory usage.

I deliberately postponed this because it would require a streaming JSON parser and substantially increase the complexity of the project.

For the current dataset, I didn't believe that complexity was justified.

---

# 7. Logging

I deliberately avoided scattering `console.log()` statements throughout the application.

Instead, I introduced a simple logging abstraction with log levels.

```
INFO

WARN

ERROR
```

The processor doesn't know where logs are written.

It only depends on the `Logger` interface.

This makes it easy to replace the console logger later with something like:

* Pino
* Winston
* Datadog
* CloudWatch

without changing any business logic.

---

# 8. Dependency Injection

The `AuditProcessor` creates none of its own dependencies.

Instead, everything is injected.

```
Parser

AI Client

Writer

Checkpoint Store

Logger

Rate Limiter

↓

AuditProcessor
```

This keeps the processor focused solely on orchestration.

It also made testing much easier because every dependency can be replaced with a mock implementation.

---

# 9. Testing Strategy

Rather than relying heavily on integration tests, I focused primarily on unit testing the application's behaviour.

External dependencies such as:

* Gemini
* file system
* CSV writer
* checkpoint store
* logger

are mocked during testing.

This allows the tests to verify the business logic without requiring:

* network access
* actual API keys
* real files

The result is a fast and deterministic test suite that validates the application's behaviour in isolation.

---

# 10. Batch Processing

One improvement I considered was processing multiple tweets in a single Gemini request.

Instead of:

```
Tweet

↓

Gemini
```

repeated thousands of times,

I could send something like:

```
20 Tweets

↓

Gemini

↓

20 Results
```

---

## Advantages

* fewer HTTP requests
* lower network overhead
* potentially lower API costs
* better throughput

---

## Why I didn't implement it

Although batching looks attractive, it introduces several complications.

The prompt becomes much larger.

The AI response becomes more difficult to validate.

A malformed response could invalidate an entire batch instead of a single tweet.

Checkpointing also becomes more complicated because multiple tweets are tied to a single API request.

For this project, I preferred simplicity and reliability over maximum throughput.

If I were optimizing purely for cost at very large scale, batching would probably be the next improvement I would explore.

---

# Reflection

This project started as a simple utility to audit old tweets.

As I continued building it, it gradually evolved into something closer to a resilient background processing system.

Most of the engineering decisions weren't about writing fewer lines of code or making the application as fast as possible.

Instead, they were about making it:

* resilient to interruptions
* recoverable after failures
* configurable for different environments
* predictable to operate
* easy to test
* easy to maintain

There are still improvements I would make for a production-scale system, such as streaming very large archives, introducing bounded concurrency, supporting batch AI requests, and persisting checkpoints to an external store instead of the local filesystem.

For the scope of this project, though, I think the current design strikes a good balance between simplicity, reliability, and maintainability while demonstrating the engineering decisions I wanted to practice.
