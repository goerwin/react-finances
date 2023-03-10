declare module 'uuid';

type Optional<T> = T | undefined;

type OptionalPropertiesOf<T extends object> = Exclude<
  {
    [K in keyof T]: T extends Record<K, T[K]> ? never : K;
  }[keyof T],
  undefined
>;

type NonOptionalPropertiesOf<T extends object> = Exclude<
  {
    [K in keyof T]: T extends Record<K, T[K]> ? K : never;
  }[keyof T],
  undefined
>;

// https://medium.com/@asainz/extending-typescript-intersection-with-optional-properties-695558ebdaad
/**
 * Construct a type with the properties common to T and U as required properties and the rest as optional properties
 */

type SafeIntersection<T, U> = {
  // K is optional in interception
  [K in OptionalPropertiesOf<T> & OptionalPropertiesOf<U>]?: T[K] | U[K];
} & {
  // K is non optional in interception
  [K in NonOptionalPropertiesOf<T> & NonOptionalPropertiesOf<U>]: T[K] | U[K];
} & {
  [K in Exclude<
    keyof T,
    OptionalPropertiesOf<T> & OptionalPropertiesOf<U>
  >]?: T[K];
} & {
  [K in Exclude<
    keyof U,
    OptionalPropertiesOf<T> & OptionalPropertiesOf<U>
  >]?: U[K];
} & {
  [K in Exclude<
    keyof T,
    NonOptionalPropertiesOf<T> & NonOptionalPropertiesOf<U>
  >]?: T[K];
} & {
  [K in Exclude<
    keyof U,
    NonOptionalPropertiesOf<T> & NonOptionalPropertiesOf<U>
  >]?: U[K];
};
