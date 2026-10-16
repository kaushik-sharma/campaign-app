/** The action a guest started before being asked to sign in. Runs once they do. */
let pending: (() => void) | null = null;

export function setPendingAuthAction(action: () => void) {
  pending = action;
}

export function runPendingAuthAction() {
  const action = pending;
  pending = null;
  action?.();
}

export function clearPendingAuthAction() {
  pending = null;
}
