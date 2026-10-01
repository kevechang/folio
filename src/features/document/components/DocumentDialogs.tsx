import { useEffect } from "react";
import { Button, Dialog } from "../../../components/ui";
import type { DocumentPersistence } from "../useDocumentPersistence";

export function DocumentDialogs({ persistence }: { persistence: DocumentPersistence }) {
  useEffect(() => {
    if (!persistence.showUnsaved && !persistence.showConflict) return;
    const handleKey = (event: KeyboardEvent) => {
      if (persistence.showUnsaved && event.metaKey && event.key === "Backspace") {
        event.preventDefault();
        persistence.discard();
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (persistence.showUnsaved) void persistence.saveAndContinue();
        else if (persistence.showConflict) {
          void persistence.resolveConflict("overwrite");
        }
      } else if (event.key === "Escape" && persistence.showUnsaved) {
        persistence.cancelUnsaved();
      }
    };
    window.addEventListener("keydown", handleKey, true);
    return () => window.removeEventListener("keydown", handleKey, true);
  }, [persistence]);

  return (
    <>
      <Dialog
        open={persistence.showUnsaved}
        onOpenChange={persistence.setShowUnsaved}
        title={`要保存对“${persistence.name}”的更改吗？`}
        description="如果不保存，你的更改将会丢失。"
      >
        <Button
          variant="ghost"
          style={{ color: "var(--danger)", marginRight: "auto" }}
          onClick={persistence.discard}
        >
          不保存
        </Button>
        <Button onClick={persistence.cancelUnsaved}>取消</Button>
        <Button variant="primary" onClick={() => void persistence.saveAndContinue()}>
          保存
        </Button>
      </Dialog>
      <Dialog
        open={persistence.showConflict}
        onOpenChange={(open) => {
          if (!open) persistence.cancelConflict();
        }}
        title={`“${persistence.name}”已在别处被修改`}
        description="磁盘上的版本比你打开时更新。"
      >
        <Button variant="ghost" onClick={() => void persistence.resolveConflict("saveAs")}>
          另存为…
        </Button>
        <Button onClick={() => void persistence.resolveConflict("disk")}>载入磁盘版本</Button>
        <Button variant="primary" onClick={() => void persistence.resolveConflict("overwrite")}>
          用我的版本覆盖
        </Button>
      </Dialog>
      <Dialog
        open={persistence.showRestore}
        onOpenChange={persistence.setShowRestore}
        title="复原到打开时的版本？"
        description="当前修改将被放弃。"
      >
        <Button onClick={() => persistence.setShowRestore(false)}>取消</Button>
        <Button variant="primary" onClick={() => void persistence.restore()}>
          复原
        </Button>
      </Dialog>
    </>
  );
}
