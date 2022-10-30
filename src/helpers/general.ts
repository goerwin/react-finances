type SortablePropertyType = string | number;

type KeysWithValsOfType<T, V> = keyof {
  [P in keyof T as T[P] extends V ? P : never]: any;
};

export function sortByDateFnCreator<
  T,
  Key extends KeysWithValsOfType<T, SortablePropertyType>
>(key: Key, asc = true) {
  return (it1: T, it2: T) => {
    // TODO: Had to manually set the type;
    const it1Val = it1[key] as SortablePropertyType;
    const it2Val = it2[key] as SortablePropertyType;

    return asc
      ? it1Val === it2Val
        ? 0
        : it1Val > it2[key]
        ? 1
        : -1
      : it1Val === it2Val
      ? 0
      : it1Val < it2[key]
      ? 1
      : -1;
  };
}
