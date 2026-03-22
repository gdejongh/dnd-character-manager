/** Module-level toast dispatcher — set by ToastContainer, called by showToast */
let addToastGlobal: ((message: string) => void) | null = null;

export function setToastDispatcher(fn: ((message: string) => void) | null) {
  addToastGlobal = fn;
}

/** Fire-and-forget toast from anywhere */
export function showToast(message: string) {
  addToastGlobal?.(message);
}
