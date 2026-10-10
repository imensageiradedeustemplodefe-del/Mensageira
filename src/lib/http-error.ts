/** Erro com status HTTP; o `handler` de lib/api transforma em resposta JSON. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
