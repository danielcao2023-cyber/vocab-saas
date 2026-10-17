/** 可以原样告诉客户端的错误（状态码 + 固定文案）；其余异常一律不外露内部信息。 */
export class HttpError extends Error { constructor(public status: number, message: string, public extra: Record<string, unknown> = {}) { super(message); } }
export function sendError(reply: { code(n: number): { send(b: unknown): unknown } }, e: unknown, fallback = 400) {
  if (e instanceof HttpError) return reply.code(e.status).send({ error: e.message, ...e.extra });
  return reply.code(fallback).send({ error: 'invalid request' });
}
/** 路由 :id：只接受 /^[1-9]\d*$/ 且是安全整数；1e2、01、-1、1.0、0x10、空格等一律 400。 */
export function parseId(raw: unknown, name = 'id') {
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw) || !Number.isSafeInteger(Number(raw))) throw new HttpError(400, `invalid ${name}`);
  return Number(raw);
}
