export class AppError extends Error {
  constructor(
    message: string,
    public readonly recoverable: boolean
  ) {
    super(message);

    this.name = this.constructor.name;
  }
}