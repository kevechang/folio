import type { LatestScene } from "./types";

export type SceneCheck = {
  elements: LatestScene["elements"];
  files: LatestScene["files"];
  viewBackgroundColor: string;
  gridSize: LatestScene["appState"]["gridSize"];
};

export function shouldCheckScene(previous: SceneCheck | null, current: SceneCheck) {
  return (
    !previous ||
    previous.elements !== current.elements ||
    previous.files !== current.files ||
    previous.viewBackgroundColor !== current.viewBackgroundColor ||
    previous.gridSize !== current.gridSize
  );
}
