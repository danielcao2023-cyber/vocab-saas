export type StatusKey = 'new'|'learning'|'familiar'|'mastered';
export const STATUS_LABELS = {new:'新词', learning:'学习中', familiar:'熟悉', mastered:'掌握'} as const;
export function statusKey(c?: {state:number|null; stability:number|null;learning_book?:string|null}|null): StatusKey {
  if(c?.learning_book)return ({new:'new',unfamiliar:'learning',familiar:'familiar',mastered:'mastered'} as const)[c.learning_book as 'new'|'unfamiliar'|'familiar'|'mastered'];
  if (!c || c.state === null || c.state === 0) return 'new';
  if (c.state === 1 || c.state === 3 || (c.stability??0)<7) return 'learning';
  return (c.stability??0)<21 ? 'familiar' : 'mastered';
}
export const wordStatus = (c?: Parameters<typeof statusKey>[0]) => c?.learning_book?({new:'生词',unfamiliar:'不熟',familiar:'熟悉',mastered:'已掌握'} as const)[c.learning_book as 'new'|'unfamiliar'|'familiar'|'mastered']:STATUS_LABELS[statusKey(c)];
