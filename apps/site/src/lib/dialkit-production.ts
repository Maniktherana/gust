type DialSchema = Record<string, unknown>;

type ResolvedDialSchema<T> = {
  [Key in keyof T]: T[Key] extends readonly [infer Default, ...unknown[]]
    ? Default
    : T[Key] extends readonly (infer Item)[]
      ? Item
      : T[Key] extends DialSchema
        ? ResolvedDialSchema<T[Key]>
        : T[Key];
};

function resolveDefaults(schema: DialSchema): DialSchema {
  return Object.fromEntries(
    Object.entries(schema).map(([key, value]) => {
      if (Array.isArray(value)) return [key, value[0]];
      if (value && typeof value === "object") return [key, resolveDefaults(value as DialSchema)];
      return [key, value];
    }),
  );
}

export function useDialKit<const Schema extends DialSchema>(
  _name: string,
  schema: Schema,
): ResolvedDialSchema<Schema> {
  return resolveDefaults(schema) as ResolvedDialSchema<Schema>;
}

export function DialRoot(_props: DialSchema) {
  return null;
}
