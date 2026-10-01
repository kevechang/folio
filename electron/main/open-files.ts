import { resolve } from "node:path";

export function commandLinePaths(args: string[]): string[] {
  return args.filter((arg) => /\.(excalidraw|json|png|svg)$/i.test(arg)).map((arg) => resolve(arg));
}

export function createOpenFiles(send: (paths: string[]) => void, focus: () => void) {
  let ready = false;
  const pending: string[] = [];
  return {
    receive(paths: string[]) {
      if (!paths.length) return;
      if (ready) send(paths);
      else pending.push(...paths);
    },
    takePending() {
      ready = true;
      return pending.splice(0);
    },
    secondInstance(args: string[]) {
      this.receive(commandLinePaths(args));
      focus();
    },
  };
}
