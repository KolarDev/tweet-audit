# Tweet Audit

> Audit your entire X (Twitter) archive with Google Gemini AI and automatically identify tweets you may want to review or delete.

This project is more than an AI wrapper.

It is a resilient background processing system built to explore production backend engineering concepts such as retries, checkpointing, graceful shutdown, rate limiting, dependency injection, structured logging and testing.

Given an exported X archive, the application processes every tweet, evaluates it against your own configurable criteria using Gemini AI, and generates a CSV containing tweets that should be reviewed.

---

# ✨ Features

* Parse an exported X archive
* Analyze every tweet with Google Gemini AI
* Generate a CSV of flagged tweets
* Configurable audit rules
* Retry failed requests with exponential backoff and jitter
* Configurable rate limiting
* Configurable checkpointing
* Resume processing after interruptions
* Graceful shutdown (Ctrl + C)
* Structured logging
* Unit tested architecture

---

# 🏗 Architecture

```text
                 X Archive
                     │
                     ▼
             Archive Parser
                     │
                     ▼
             Audit Processor
                     │
      ┌──────────────┼──────────────┐
      ▼              ▼              ▼
 Prompt Builder  Rate Limiter   Retry Engine
      │                              │
      └──────────────┬───────────────┘
                     ▼
                Gemini AI
                     │
      ┌──────────────┼──────────────┐
      ▼              ▼              ▼
Checkpoint Store  CSV Writer    Logger
                     │
                     ▼
               flagged.csv
```

---

# ⭐ Engineering Decisions

One of the primary goals of this project was to practice backend engineering rather than simply consuming an AI API.

Every major architectural decision is documented in:

# 👉 **tradeoffs.md**

That document explains:

* Why I chose sequential processing instead of concurrency
* Why retries use exponential backoff with jitter
* Why checkpointing is configurable
* Why rate limiting was added
* Why the archive currently loads into memory
* Why dependency injection was used throughout the project
* Future improvements I intentionally postponed

**If you're reviewing this repository, I highly recommend reading `tradeoffs.md` before diving into the source code.**

---

# 📁 Project Structure

```text
tweet-audit/

├── archive/
│   └── data/
│       └── tweets.js
│
├── src/
│   ├── ai/
│   ├── checkpoint/
│   ├── config/
│   ├── errors/
│   ├── limiter/
│   ├── logger/
│   ├── parser/
│   ├── processor/
│   ├── types/
│   ├── utils/
│   ├── writer/
│   └── index.ts
│
├── tests/
│
├── config.json
├── tradeoffs.md
├── package.json
└── README.md
```

---

# 📦 Requirements

* Node.js 20+
* npm
* Google Gemini API Key

---

# 🚀 Installation

Clone the repository.

```bash
git clone https://github.com/yourusername/tweet-audit.git

cd tweet-audit
```

Install dependencies.

```bash
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file in the project root.

```env
GEMINI_API_KEY=your_gemini_api_key_here

USE_MOCK=false
```

## GEMINI_API_KEY

Your Google Gemini API key.

## USE_MOCK

Switch between the real Gemini client and the mock implementation.

```env
USE_MOCK=true
```

Uses the mock AI client.

Useful while developing without consuming Gemini quota.

```env
USE_MOCK=false
```

Uses the real Gemini API.

---

# 🐦 Export Your X Archive

Request your archive from X.

After downloading and extracting it, copy the archive into:

```text
archive/
└── data/
    └── tweets.js
```

The project expects exactly this location.

---

# ⚙ Configuration

The application's behaviour is controlled through `config.json`.

```json
{
  "criteria": {
    "forbiddenWords": [
      "crypto",
      "NFT",
      "hustlegrindset"
    ],
    "professionalCheck": true,
    "excludePolitics": true,
    "tone": "respectful and thoughtful"
  },
  "processing": {
    "requestsPerSecond": 10,
    "checkpointInterval": 10
  }
}
```

## Criteria

These values are included in the prompt sent to Gemini.

| Setting             | Description              |
| ------------------- | ------------------------ |
| `forbiddenWords`    | Words or phrases to flag |
| `professionalCheck` | Evaluate professionalism |
| `excludePolitics`   | Flag political content   |
| `tone`              | Desired writing style    |

## Processing

These values control how the application runs.

### requestsPerSecond

Controls the built-in rate limiter.

Increase it if your Gemini quota allows more throughput.

Decrease it if you begin receiving rate-limit errors.

### checkpointInterval

Controls how often progress is saved.

For example,

```text
checkpointInterval = 10
```

means a checkpoint is written after every 10 successfully processed tweets.

Smaller values

* safer recovery
* more frequent disk writes

Larger values

* fewer writes
* more tweets may be reprocessed after interruption

---

# ▶ Running the Application

Development

```bash
npm run dev
```

Production

```bash
npm run build

npm start
```

---

# 📄 Output

Flagged tweets are written to:

```text
flagged.csv
```

Example:

```csv
tweet_url,deleted

https://x.com/i/web/status/123,false
https://x.com/i/web/status/456,false
```

Tweets are intentionally marked as `deleted=false`.

This gives you the opportunity to manually review them before taking any action.

---

# 💾 Checkpointing

Long-running AI jobs shouldn't have to start over every time something goes wrong.

This project periodically saves:

* last processed index
* processed count
* flagged count
* failed count
* timestamp

The checkpoint interval is configurable through `config.json`.

When the application starts, it checks for an existing checkpoint and resumes from the most recently saved position.

When processing completes successfully, the checkpoint file is automatically removed.

---

# 🛑 Graceful Shutdown

Pressing

```text
Ctrl + C
```

doesn't immediately terminate the application.

Instead it:

1. Saves the latest checkpoint.
2. Shuts down safely.

This minimizes duplicated work during long-running audits.

---

# 🔁 Retry Strategy

Temporary failures are automatically retried.

The retry mechanism includes:

* exponential backoff
* jitter
* configurable retry attempts
* configurable maximum delay
* retry filtering

Only retryable errors are attempted again.

Permanent failures immediately bubble up.

---

# 🚦 Rate Limiting

Every Gemini request passes through a configurable rate limiter.

This helps reduce:

* HTTP 429 responses
* API throttling
* unnecessary retries

The request rate can be adjusted through:

```json
"processing": {
  "requestsPerSecond": 10
}
```

Different AI providers or pricing plans may require different limits.

---

# 📝 Logging

The application emits structured logs.

Example:

```text
[INFO] Loaded 4941 tweets

[INFO] Checkpoint found. Resuming from tweet 301.

[INFO] Checkpoint saved.

[WARN] Retry 2/3. Waiting 1438ms...

[ERROR] Failed to process tweet.
```

Structured logging makes debugging much easier during long-running jobs.

---

# 🧪 Testing

Run all tests.

```bash
npm test
```

or

```bash
npm run test:run
```

The project uses **Vitest**.

External dependencies such as Gemini, the filesystem, writers and checkpoint storage are mocked to keep tests deterministic and fast.

---

# 📖 Read Before Exploring the Code

The most interesting part of this project isn't just the implementation—it's the reasoning behind it.

I documented every major architectural decision in:

# 👉 **tradeoffs.md**

Topics include:

* Sequential Processing vs Concurrency
* Retry Strategy
* Configurable Checkpointing
* Graceful Shutdown
* Rate Limiting
* Dependency Injection
* Logging
* Testing Strategy
* Future Improvements

Reading `tradeoffs.md` first will provide much better context for understanding the codebase.

---

# 🚀 Future Improvements

Some ideas intentionally left out of this version include:

* Stream the archive instead of loading it entirely into memory
* Worker pools with bounded concurrency
* Batch processing multiple tweets in a single AI request
* Persistent checkpoint storage (Redis or database)
* Multiple AI provider support
* CLI progress bar
* Automatic tweet deletion through the X API

---

# 📄 License

MIT
