import {useEffect, useRef} from 'react';

const noop = () => {};

export default function useIntervel(callback,delay, immediate){
  // see https://github.com/Hermanya/use-interval/blob/master/src/index.tsx
  // gatsby v3およびreact v17へのキャッチアップまでのつなぎ

  const savedCallback = useRef(noop);

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  });

  // Execute callback if immediate is set.
  useEffect(() => {
    if (!immediate) return;
    if (delay === undefined || delay === null || delay === false) return;
    savedCallback.current();
  }, [immediate,delay]);

  // Set up the interval.
  useEffect(() => {
    if (delay === undefined || delay === null || delay === false) return undefined;
    const tick = () => savedCallback.current();
    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}