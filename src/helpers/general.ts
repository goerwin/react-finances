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

/**
 * Type assertion on const/readonly arrays with resolved type
 */
export function arrayIncludes<T extends U, U>(
  arr: ReadonlyArray<T>,
  el: U
): el is T {
  return arr.includes(el as T);
}

let loadScriptPromises: Record<
  string,
  Optional<{ promise: Promise<any>; domEl: HTMLElement }>
> = {};
/** Loads any script via Promises */
export async function loadScript(scriptId: string, scriptUrl: string) {
  // if script promise already set, return it

  if (loadScriptPromises[scriptId])
    return loadScriptPromises[scriptId]?.promise;

  // add script to the body
  const scriptDomEl = document.createElement('script');
  scriptDomEl.id = scriptId;
  document.body.appendChild(scriptDomEl);
  scriptDomEl.src = scriptUrl;

  const promise = new Promise((resolve, reject) => {
    scriptDomEl.onload = resolve;
    scriptDomEl.onerror = (err) => {
      loadScriptPromises[scriptId] = undefined;
      document.getElementById(scriptId);
      scriptDomEl.remove();
      reject(err);
    };
  });

  loadScriptPromises[scriptId] = { domEl: scriptDomEl, promise };
  return promise;
}
