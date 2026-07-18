export class RateLimiter {
  private lastRequest = 0;

  constructor(private readonly interval: number) {}

  async wait(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequest;

    if (elapsed < this.interval) {
      await new Promise(resolve =>
        setTimeout(resolve, this.interval - elapsed)
      );
    }

    this.lastRequest = Date.now();
  }
}