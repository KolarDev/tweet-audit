# Tweet Audit

A resilient command-line application that audits your X (Twitter) archive using Google's Gemini AI.

The application reads your exported X archive, evaluates every tweet against configurable criteria, and generates a CSV containing tweets that should be reviewed or deleted.

The goal of this project wasn't only to integrate an AI API. It was built to explore the engineering challenges behind long-running background jobs such as retries, checkpointing, resumable processing, rate limiting, dependency injection, and testing.

---

# Features

* Parse an exported X archive
* Analyze every tweet with Gemini AI
* Generate a CSV of flagged tweets
* Configurable audit criteria
* Retry failed requests using exponential backoff with jitter
* Configurable rate limiting
* Configurable checkpointing
* Resume after interruption
* Graceful shutdown (Ctrl + C)
* Structured logging
* Unit tested architecture

---

# Project Structure

```text
src/
├── ai/
├── checkpoint/
├── config/
├── errors/
├── logger/
├── parser/
├── processor/
├── limiter/
├── types/
├── utils/
├── writer/
└── index.ts

tests/
```

---

# Requirements

* Node.js 20+
* npm
* Google Gemini API Key

---

# Installation

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

# Environment Variables

Create a `.env` file in the project root.

```env
GEMINI_API_KEY=your_api_key_here

USE_MOCK=false
```

## GEMINI_API_KEY

Your Google Gemini API key.

## USE_MOCK

Controls whether the application uses the real Gemini API.

```env
USE_MOCK=true
```

Uses the mock AI client.

Useful while developing without consuming API quota.

```env
USE_MOCK=false
```

Uses the real Gemini API.

---

# Exporting Your X Archive

Request your archive from X.

After downloading and extracting it, copy the archive into:

```text
archive/
└── data/
    └── tweets.js
```

The final structure should look like:

```text
tweet-audit/

archive/
└── data/
    └── tweets.js
```

---

# Configure Audit Rules

Edit `config.json`.

Example:

```json
{
  "criteria": {
    "forbiddenWords": [
      "crypto",
      "NFT"
    ],
    "professionalCheck": true,
    "excludePolitics": true,
    "tone": "respectful and thoughtful"
  }
}
```

These rules are included in the prompt sent to Gemini for every tweet.

---

# Running the Application

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

# Output

Flagged tweets are written to

```text
flagged.csv
```

Example:

```csv
tweet_url,deleted

https://x.com/i/web/status/123,false
https://x.com/i/web/status/456,false
```

The application intentionally marks every tweet as `deleted=false`.

This allows you to manually review tweets before deleting them.

---

# Checkpointing

Long-running AI jobs can be interrupted.

Instead of starting over, the application periodically saves progress.

The checkpoint stores:

* last processed index
* processed count
* flagged count
* failed count
* timestamp

If the application stops unexpectedly, it resumes from the latest saved checkpoint.

When the audit finishes successfully, the checkpoint is automatically removed.

---

# Graceful Shutdown

Pressing

```text
Ctrl + C
```

doesn't immediately terminate the application.

Instead it:

1. saves the latest checkpoint
2. exits safely

This minimizes repeated work when the application is started again.

---

# Retry Strategy

Temporary API failures are automatically retried.

The retry system uses:

* exponential backoff
* jitter
* configurable maximum delay
* configurable retry attempts

Only retryable errors are retried.

Permanent failures immediately bubble up.

---

# Rate Limiting

Requests to Gemini are rate limited.

This reduces the likelihood of:

* HTTP 429 responses
* API throttling
* unnecessary retries

The delay is configurable and can easily be adjusted for different API plans.

---

# Logging

The application emits structured log messages.

Example:

```text
[INFO] Loaded 4941 tweets

[INFO] Checkpoint found. Resuming from tweet 1201.

[INFO] Checkpoint saved.

[WARN] Retry 2/3. Waiting 1453ms...

[ERROR] Failed to process tweet.
```

---

# Testing

Run the test suite.

```bash
npm test
```

or

```bash
npm run test:run
```

The project uses Vitest with mocked dependencies to keep tests fast and deterministic.

---

# Engineering Decisions

Some of the architectural decisions documented in this project include:

* Sequential processing vs concurrency
* Exponential backoff with jitter
* Configurable checkpointing
* Graceful shutdown
* Configurable rate limiting
* Dependency injection
* Structured logging
* Testable architecture

A more detailed discussion can be found in:

```text
tradeoffs.md
```

---

# Future Improvements

Some ideas intentionally left out of this version include:

* Streaming the archive instead of loading it entirely into memory
* Worker pools with bounded concurrency
* Batch processing multiple tweets per AI request
* Persistent checkpoint storage (database or Redis)
* Support for multiple AI providers
* Progress bar in the terminal
* Automatic tweet deletion through the X API

---

# License

MIT
