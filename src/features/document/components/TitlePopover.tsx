import { useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "../../../components/ui";
import { middleEllipsis } from "../../../lib/format";
import { spring } from "../../../lib/motion";
import { platform } from "../../../lib/platform";
import type { DocumentPersistence } from "../useDocumentPersistence";

function SaveIndicator({ persistence }: { persistence: DocumentPersistence }) {
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    if (persistence.saveSequence === 0) return;
    setShowCheck(true);
    const timer = setTimeout(() => setShowCheck(false), 900);
    return () => clearTimeout(timer);
  }, [persistence.saveSequence]);

  const marker = persistence.dirty ? "dirty" : showCheck ? "saved" : "none";

  return (
    <span className="folio-save-indicator">
      <AnimatePresence mode="wait">
        {marker === "dirty" && (
          <motion.i
            key="dirty"
            className="folio-dirty-dot"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={spring.snappy}
          />
        )}
        {marker === "saved" && (
          <motion.span
            key="saved"
            className="folio-saved-check"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Check size={11} strokeWidth={2.5} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export function TitlePopover({
  persistence,
  subtitle,
}: {
  persistence: DocumentPersistence;
  subtitle?: string;
}) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(persistence.name);

  useEffect(() => setInput(persistence.name), [persistence.name]);

  async function submitName() {
    const renamed = await persistence.rename(input);
    if (renamed) setOpen(false);
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button className="folio-title-button" type="button">
          <span className="folio-title-name">
            {persistence.name}
            <ChevronDown size={12} />
          </span>
          <small>
            <SaveIndicator persistence={persistence} />
            <AnimatePresence mode="wait">
              <motion.span
                key={persistence.status}
                initial={{ opacity: 0, y: reduced ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduced ? 0 : -6 }}
                transition={{ duration: reduced ? 0.12 : 0.16 }}
              >
                {subtitle ?? persistence.status}
              </motion.span>
            </AnimatePresence>
          </small>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={6} className="folio-title-popover">
          <input
            aria-label="文稿名称"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void submitName();
            }}
          />
          <div className="folio-path">
            <span title={persistence.path ?? "草稿"}>
              {middleEllipsis(persistence.path ?? "草稿", 29)}
            </span>
            <Button
              variant="ghost"
              small
              disabled={!persistence.path}
              onClick={() => {
                if (persistence.path) void platform.revealInFinder(persistence.path);
              }}
            >
              在 Finder 中显示
            </Button>
          </div>
          <hr />
          <Button
            variant="ghost"
            onClick={() => {
              setOpen(false);
              persistence.setShowRestore(true);
            }}
          >
            复原到打开时的版本…
          </Button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
