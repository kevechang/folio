import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { documentBasename } from "../../lib/document-name";
import {
  listDrafts,
  safeDelete,
  safeGet,
  safeSet,
  removeRecent,
  type Draft,
  type Recent,
} from "../../lib/persistence";
import { platform, type FileEntry } from "../../lib/platform";
import { filterByName, mergeMissing, sortDrafts } from "./model";
import { markdownMetadata } from "../../lib/markdown";
import type { LibraryItem } from "./types";

type Options = {
  recents: Recent[];
  section: string;
  onSection: (section: string) => void;
  onRecents: (items: Recent[]) => void;
  query: string;
};

export function useLibraryData({ recents, section, onSection, onRecents, query }: Options) {
  const [folders, setFolders] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [missing, setMissing] = useState<Set<string>>(new Set());
  const [draftsLoaded, setDraftsLoaded] = useState(false);
  const [entriesSection, setEntriesSection] = useState<string | null>(null);
  const currentSection = useRef(section);
  currentSection.current = section;

  const loadDrafts = useCallback(() => {
    void listDrafts().then((items) => {
      setDrafts(sortDrafts(items));
      setDraftsLoaded(true);
    });
  }, []);
  const scan = useCallback((folder: string) => {
    void platform
      .listDocuments(folder)
      .then(async (items) => {
        const enriched = await Promise.all(
          items.map(async (item) => {
            if (item.kind !== "markdown") return item;
            try {
              return {
                ...item,
                ...markdownMetadata(await platform.readTextFile(item.path), item.name),
              };
            } catch {
              return item;
            }
          }),
        );
        if (folder !== currentSection.current) return;
        setEntries(enriched);
        setEntriesSection(folder);
      })
      .catch(() => {
        if (folder !== currentSection.current) return;
        setEntries([]);
        setEntriesSection(folder);
      });
  }, []);

  useEffect(() => {
    void safeGet<string[]>("folders", []).then(async (saved) => {
      await Promise.all(saved.map((folder) => platform.authorizeFolder(folder)));
      setFolders(saved);
    });
    loadDrafts();
  }, [loadDrafts]);
  useEffect(() => {
    if (section === "recent")
      void Promise.all(recents.map((item) => platform.stat(item.path).catch(() => null))).then(
        (stats) =>
          setMissing(
            new Set(
              mergeMissing(recents, stats)
                .filter((item) => item.missing)
                .map((item) => item.id),
            ),
          ),
      );
    else if (section === "draft") loadDrafts();
    else scan(section);
  }, [section, recents, loadDrafts, scan]);
  useEffect(() => {
    const focus = () => {
      if (section !== "recent" && section !== "draft") scan(section);
      else if (section === "draft") loadDrafts();
    };
    window.addEventListener("focus", focus);
    return () => window.removeEventListener("focus", focus);
  }, [section, scan, loadDrafts]);

  const items = useMemo(() => {
    const all: LibraryItem[] =
      section === "recent"
        ? recents.map((item) => ({
            id: item.id,
            path: item.path,
            name: item.name,
            kind: item.kind,
            time: item.lastOpenedAt,
            count: item.elementCount,
            bg: item.bg,
            mtime: item.mtime,
            missing: missing.has(item.id),
            section: "recent",
            title: item.title,
            excerpt: item.excerpt,
            words: item.words,
          }))
        : section === "draft"
          ? drafts.map((item) => ({
              id: item.id,
              path: null,
              name: item.name,
              kind: item.kind === "markdown" ? "markdown" : "draft",
              time: item.updatedAt,
              count: 0,
              bg: "var(--manilla)",
              mtime: item.updatedAt,
              section: "draft",
              ...(item.kind === "markdown" ? markdownMetadata(item.text ?? "", item.name) : {}),
            }))
          : entries.map((item) => ({
              id: item.path,
              path: item.path,
              name: documentBasename(item.name),
              kind: item.kind,
              time: item.mtime,
              count: 0,
              bg: "var(--manilla)",
              mtime: item.mtime,
              section: "folder",
              title: item.title,
              excerpt: item.excerpt,
              words: item.words,
            }));
    return filterByName(all, query);
  }, [section, recents, drafts, entries, missing, query]);

  const addFolder = async () => {
    const path = await platform.pickFolder();
    if (!path || folders.includes(path)) return;
    const next = [...folders, path];
    setFolders(next);
    await safeSet("folders", next);
    onSection(path);
  };
  const removeFolder = (folder: string) => {
    void platform.removeFolderAuthorization(folder);
    const next = folders.filter((item) => item !== folder);
    setFolders(next);
    void safeSet("folders", next);
    if (section === folder) onSection("recent");
  };
  const removeItem = async (item: LibraryItem) => {
    if (item.section === "recent") onRecents(removeRecent(recents, item.id));
    if (item.section === "draft") {
      await Promise.all([safeDelete(`draft:${item.id}`), safeDelete(`thumb:${item.id}`)]);
      setDrafts((items) => items.filter((draft) => draft.id !== item.id));
    }
  };
  return {
    folders,
    drafts,
    items,
    contentReady:
      section === "recent" || (section === "draft" ? draftsLoaded : entriesSection === section),
    addFolder,
    removeFolder,
    removeItem,
  };
}
