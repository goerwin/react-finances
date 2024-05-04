import { useRef, useState } from 'react';
import { TokenInfo, addItem } from '../api/actions';
import { getCategoryName } from '../helpers/general';
import {
  DB,
  DBListItem,
  Queue,
  actionSchema,
  categorySchema,
  tagSchema,
} from '../helpers/schemas';
import { formatNumberValueToCurrency } from './Calculator';
import { getLsQueue, setLsQueue } from '../helpers/localStorage';

export interface Props {}

async function tryPromise<T>(
  promise: Promise<T>
): Promise<[Error, null] | [null, T]> {
  try {
    return [null, await promise];
  } catch (err) {
    return [err instanceof Error ? err : new Error('Error'), null];
  }
}

function getInitialQueueStatus(queue: Queue) {
  if (queue.length === 0) return 'empty' as const;
  if (queue.some((it) => it.status === 'error')) return 'error' as const;
  if (queue.some((it) => it.status === 'processing'))
    return 'processing' as const;
  return 'ready' as const;
}

function getInitialQueue(queue: Queue) {
  return queue.filter((it) => it.status !== 'processing');
}

export function useQueue(props: {
  tokenInfo?: TokenInfo;
  gdFileId?: string;
  db?: DB;
  onQueueItem: (data: DB) => void;
}) {
  const queueRef = useRef(getInitialQueue(getLsQueue()));
  const [queue, setQueue] = useState(queueRef.current);
  const [status, setStatus] = useState(getInitialQueueStatus(queue));
  const queueInProgressRef = useRef(false);

  function clean() {
    queueRef.current = [];
    syncQueue();
  }

  function syncQueue() {
    setQueue([...queueRef.current]);
    setLsQueue([...queueRef.current]);

    if (queueRef.current.length === 0) setStatus('empty');
    else if (queueRef.current.some((it) => it.status === 'error'))
      setStatus('error');
    else if (queueRef.current.some((it) => it.status === 'processing'))
      setStatus('processing');
    else setStatus('ready');
  }

  async function processQueue() {
    if (queueRef.current.length === 0 || queueInProgressRef.current) {
      queueInProgressRef.current = false;
      return syncQueue();
    }

    queueInProgressRef.current = true;
    const queueItem = queueRef.current[0];

    if (!props.gdFileId || !props.tokenInfo) return;
    if (queueItem.status === 'processing') return;

    queueItem.status = 'processing';
    syncQueue();

    // await wait(2);
    // const [err, resp] = [new Error('erwer'), {} as any];

    // send the actual api request
    const [err, resp] =
      queueItem.apiAction === 'add'
        ? await tryPromise(
            addItem(props.tokenInfo, {
              data: queueItem.data,
              type: queueItem.type,
              schema:
                queueItem.type === 'actions'
                  ? actionSchema
                  : queueItem.type === 'categories'
                  ? categorySchema
                  : tagSchema,
              gdFileId: props.gdFileId,
            })
          )
        : [new Error('apiAction not supported')];

    // stop processing the queue on error
    if (err) {
      queueItem.status = 'error';
      queueInProgressRef.current = false;
      return syncQueue();
    }

    // remove first item from queue and continue
    queueInProgressRef.current = false;
    queueRef.current = queueRef.current.slice(1);
    syncQueue();
    props.onQueueItem(resp);
    processQueue();
  }

  function addToQueue(data: unknown, type: DBListItem, apiAction: 'add') {
    const parsedData = type === 'actions' ? actionSchema.safeParse(data) : null;

    if (!props.db || !parsedData?.success) return false;

    const action = parsedData.data;
    const title = formatNumberValueToCurrency(action.value);
    const description = `${getCategoryName(
      props.db.categories,
      action.categoryId
    )} | ${action.type === 'expense' ? 'Gasto' : 'Ingreso'}`;

    queueRef.current = [
      ...queueRef.current,
      { type, status: 'ready', apiAction, title, description, data: action },
    ];

    syncQueue();
    processQueue();
    return true;
  }

  return { addToQueue, queue, processQueue, status, clean };
}
