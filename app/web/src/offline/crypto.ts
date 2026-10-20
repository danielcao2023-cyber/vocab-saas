/** Shared learning engine uses only this Node crypto operation in the mobile build. */
export const randomUUID=()=>globalThis.crypto.randomUUID();
