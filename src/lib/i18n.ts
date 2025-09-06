import jaMessages from '../i18n/ja.json';

type Messages = typeof jaMessages;
type MessageKey = keyof Messages;
type NestedMessageKey<T> = T extends object 
  ? { [K in keyof T]: K extends string ? T[K] extends object 
      ? `${K}.${NestedMessageKey<T[K]>}` 
      : K 
    : never }[keyof T]
  : never;

type AllMessageKeys = MessageKey | NestedMessageKey<Messages>;

const messages: Messages = jaMessages;

export function t(key: AllMessageKeys): string {
  const keys = key.split('.');
  let value: any = messages;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key;
    }
  }
  
  return typeof value === 'string' ? value : key;
}