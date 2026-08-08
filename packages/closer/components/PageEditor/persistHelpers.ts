export const shouldApplyPersistSnapshot = (
  snapshotRevision: number,
  currentRevision: number,
): boolean => snapshotRevision === currentRevision;

export const pagesMatchPersistTarget = (
  currentId: string,
  targetId: string,
  wasCreating: boolean,
  isVirtualId: (id: string) => boolean,
): boolean =>
  currentId === targetId || (wasCreating && isVirtualId(currentId));
