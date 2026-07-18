import { AppError } from "./app-error";

export class ArchiveNotFoundError extends AppError {
  constructor(path: string) {
    super(
      `Could not find X archive.\nExpected: ${path}\nExtract your X archive into the project's archive folder.`,
      false
    );
  }
}

export class InvalidArchiveError extends AppError {
  constructor() {
    super(
      "The X archive is malformed or has an unexpected format.",
      false
    );
  }
}