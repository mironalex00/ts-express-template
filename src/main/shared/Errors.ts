export class HTTPError extends Error {
  constructor(public readonly code: number, public readonly message: string) {
    super(message);
  }
}