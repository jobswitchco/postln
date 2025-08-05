// utils/useDebounce.js
import { useEffect, useState } from "react";

function useDebounce(value, delay) {
  const [debouncedVal, setDebouncedVal] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedVal(value), delay || 500);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedVal;
}

export default useDebounce;
