import React, { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  briefAlchemyError,
  type AlchemyElement,
} from "@/services/alchemyService";
import {
  MEDIA_IMAGE_ACCEPT,
  MEDIA_IMAGE_MAX_SIZE,
  MediaImageService,
  type MediaImage,
} from "@/services/mediaImageService";
import type { Recipe } from "./alchemy.types";

const MEDIA_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function formatImageSize(size: number) {
  if (size < 1024) return `${size} Б`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} КБ`;
  return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
}

function HighlightedExpression({ value }: { value: string }) {
  const parts = value.split(
    /(\b(?:normalize|element|anime|manga)\b|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b\d+(?:\.\d+)?\b|[+\-*/^()]|\s+)/g,
  );

  return (
    <>
      {parts.map((part, index) => {
        let className = "text-foreground";
        if (/^(normalize|element|anime|manga)$/.test(part)) {
          className = "text-sky-300";
        } else if (/^[+\-*/^()]$/.test(part)) {
          className = "text-amber-300";
        } else if (/^(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')$/.test(part)) {
          className = "text-emerald-300";
        } else if (/^\d+(?:\.\d+)?$/.test(part)) {
          className = "text-violet-300";
        } else if (/^\s+$/.test(part)) {
          className = "text-foreground";
        }

        return (
          <span className={className} key={`${part}-${index}`}>
            {part}
          </span>
        );
      })}
    </>
  );
}

function RecipeCodeEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string, cursor: number) => void;
}) {
  const [cursor, setCursor] = useState(value.length);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCursor(value.length);
  }, [value]);

  const updateExpression = (nextValue: string, nextCursor: number) => {
    setCursor(nextCursor);
    onChange(nextValue, nextCursor);
  };

  const insertAtCursor = (snippet: string, cursorOffset = snippet.length) => {
    const start = editorRef.current?.selectionStart ?? cursor;
    const end = editorRef.current?.selectionEnd ?? start;
    const next = value.slice(0, start) + snippet + value.slice(end);
    const nextCursor = start + cursorOffset;
    updateExpression(next, nextCursor);
    window.requestAnimationFrame(() => {
      editorRef.current?.focus();
      editorRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-[#10131a] shadow-inner">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Icon icon="material-symbols:code-rounded" className="text-sky-300" />
          <span className="font-mono text-xs font-semibold text-slate-200">
            vector.expression
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">
          {value.length} символів
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1 border-b border-white/10 px-3 py-2">
        <span className="mr-1 text-[10px] uppercase tracking-wider text-slate-500">
          Вставити
        </span>
        {[" + ", " - ", " * ", " / ", " ^ ", "(", ")"].map((operator) => (
          <button
            type="button"
            key={operator}
            onClick={() => insertAtCursor(operator)}
            className="rounded-md px-2 py-1 font-mono text-xs font-semibold text-amber-300 transition-colors hover:bg-white/10"
          >
            {operator.trim()}
          </button>
        ))}
        <button
          type="button"
          onClick={() => insertAtCursor("normalize()", "normalize(".length)}
          className="rounded-md px-2 py-1 font-mono text-xs font-semibold text-sky-300 transition-colors hover:bg-white/10"
        >
          normalize()
        </button>
      </div>
      <div className="relative min-h-44 font-mono text-[13px] leading-6">
        <pre
          aria-hidden
          className="pointer-events-none m-0 min-h-44 whitespace-pre-wrap break-words p-4 text-slate-200"
        >
          {value ? (
            <HighlightedExpression value={value} />
          ) : (
            <span className="text-slate-600">
              normalize((anime(&quot;frieren-123&quot;) - anime(&quot;one-piece&quot;))) / 2
            </span>
          )}
        </pre>
        <textarea
          ref={editorRef}
          value={value}
          onChange={(event) => {
            const nextCursor = event.target.selectionStart;
            updateExpression(event.target.value, nextCursor);
          }}
          onSelect={(event) => setCursor(event.currentTarget.selectionStart)}
          onClick={(event) => setCursor(event.currentTarget.selectionStart)}
          spellCheck={false}
          aria-label="Векторний вираз"
          className="absolute inset-0 min-h-44 w-full resize-y bg-transparent p-4 font-mono text-[13px] leading-6 text-transparent caret-sky-200 outline-none selection:bg-sky-400/25"
        />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-white/10 px-4 py-2.5 font-mono text-[10px] text-slate-500">
        <span><i className="mr-1 inline-block size-2 rounded-full bg-sky-300" />функція</span>
        <span><i className="mr-1 inline-block size-2 rounded-full bg-emerald-300" />ідентифікатор</span>
        <span><i className="mr-1 inline-block size-2 rounded-full bg-amber-300" />оператор</span>
        <span><i className="mr-1 inline-block size-2 rounded-full bg-violet-300" />число</span>
      </div>
    </div>
  );
}

function ImagePreview({ url }: { url: string }) {
  if (!url) {
    return (
      <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 text-muted-foreground">
        <Icon icon="material-symbols:image-outline" className="text-2xl" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      className="size-20 shrink-0 rounded-2xl border border-border bg-muted object-cover"
    />
  );
}

function MediaPicker({
  open,
  onOpenChange,
  images,
  selectedUrl,
  loading,
  uploading,
  deletingId,
  error,
  imageInputRef,
  onRefresh,
  onUpload,
  onSelect,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: MediaImage[];
  selectedUrl: string;
  loading: boolean;
  uploading: boolean;
  deletingId: string | null;
  error: string | null;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  onRefresh: () => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSelect: (url: string) => void;
  onDelete: (image: MediaImage) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-5 py-4 pr-12 text-left sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle>Медіатека</DialogTitle>
              <DialogDescription className="mt-1">
                Виберіть обкладинку для елемента або завантажте нову.
              </DialogDescription>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => imageInputRef.current?.click()}
            >
              <Icon icon={uploading ? "svg-spinners:90-ring-with-bg" : "material-symbols:upload"} />
              {uploading ? "Завантаження…" : "Завантажити"}
            </Button>
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept={MEDIA_IMAGE_ACCEPT}
            className="hidden"
            onChange={onUpload}
          />
        </DialogHeader>
        <div className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {images.length ? `${images.length} зображень` : "Зображень ще немає"}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={loading}
              onClick={onRefresh}
            >
              <Icon icon={loading ? "svg-spinners:90-ring-with-bg" : "material-symbols:refresh"} />
              Оновити
            </Button>
          </div>
          {error && (
            <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          {loading && !images.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="aspect-square animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : images.length ? (
            <div className="grid max-h-[min(55vh,34rem)] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((image) => {
                const selected = selectedUrl === image.url;
                return (
                  <div
                    key={image.id}
                    className={`group relative overflow-hidden rounded-2xl border bg-muted/20 transition ${selected ? "border-violet-400 ring-2 ring-violet-400/35" : "border-border hover:border-violet-400/50"}`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(image.url);
                        onOpenChange(false);
                      }}
                      className="block w-full text-left"
                      title={`Вибрати ${image.originalFilename}`}
                    >
                      <img src={image.url} alt="" className="aspect-square w-full object-cover" />
                      <span className="block truncate px-2.5 pt-2 text-xs font-medium">
                        {image.originalFilename}
                      </span>
                      <span className="block px-2.5 pb-2.5 text-[10px] text-muted-foreground">
                        {image.contentType.replace("image/", "").toUpperCase()} · {formatImageSize(image.size)}
                      </span>
                    </button>
                    {selected && (
                      <span className="absolute left-2 top-2 flex size-6 items-center justify-center rounded-full bg-violet-500 text-white shadow-lg">
                        <Icon icon="material-symbols:check" className="text-sm" />
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-xs"
                      className="absolute right-2 top-2 shadow-lg sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
                      disabled={deletingId === image.id}
                      onClick={() => onDelete(image)}
                      aria-label={`Видалити ${image.originalFilename}`}
                    >
                      <Icon icon={deletingId === image.id ? "svg-spinners:90-ring-with-bg" : "material-symbols:delete-outline"} />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 text-center">
              <Icon icon="material-symbols:photo-library-outline" className="mb-3 text-3xl text-muted-foreground" />
              <p className="font-medium">Медіатека порожня</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Завантажте перше зображення, щоб використовувати його в елементах алхімії.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AlchemyAdminWorkspace({
  elements,
  adminElement,
  adminName,
  adminDescription,
  adminImageUrl,
  adminExpression,
  replaceVector,
  lastRecipe,
  saving,
  onNew,
  onEdit,
  onName,
  onDescription,
  onImage,
  onExpression,
  onReplace,
  onSave,
  onDelete,
  onDirtyChange,
}: {
  elements: AlchemyElement[];
  adminElement: AlchemyElement | null;
  adminName: string;
  adminDescription: string;
  adminImageUrl: string;
  adminExpression: string;
  replaceVector: boolean;
  lastRecipe: Recipe | null;
  saving: boolean;
  onNew: () => void;
  onEdit: (element: AlchemyElement) => Promise<void> | void;
  onName: (value: string) => void;
  onDescription: (value: string) => void;
  onImage: (value: string) => void;
  onExpression: (value: string, cursor: number) => void;
  onReplace: (value: boolean) => void;
  onSave: () => Promise<boolean> | boolean | void;
  onDelete: (element: AlchemyElement) => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [listQuery, setListQuery] = useState("");
  const [mobileEditorOpen, setMobileEditorOpen] = useState(Boolean(adminElement));
  const [dirty, setDirty] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AlchemyElement | null>(null);
  const [mediaImages, setMediaImages] = useState<MediaImage[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaDeletingId, setMediaDeletingId] = useState<string | null>(null);
  const [mediaDeleteTarget, setMediaDeleteTarget] = useState<MediaImage | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const filteredElements = elements.filter((item) =>
    item.name.toLowerCase().includes(listQuery.trim().toLowerCase()),
  );

  const loadMediaImages = useCallback(async () => {
    setMediaLoading(true);
    try {
      const response = await MediaImageService.list({ size: 100 });
      setMediaImages(response.content);
      setMediaError(null);
    } catch (loadError) {
      setMediaError(
        briefAlchemyError(loadError, "Не вдалося завантажити медіатеку."),
      );
    } finally {
      setMediaLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMediaImages();
  }, [loadMediaImages]);

  useEffect(() => {
    setMobileEditorOpen(Boolean(adminElement));
    setDirty(false);
  }, [adminElement?.id]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const runOrConfirm = (action: () => void) => {
    if (dirty) {
      setPendingAction(() => action);
      return;
    }
    action();
  };

  const selectElement = async (element: AlchemyElement) => {
    await onEdit(element);
    setMobileEditorOpen(true);
    setDirty(false);
  };

  const handleEdit = (element: AlchemyElement) => {
    runOrConfirm(() => {
      void selectElement(element);
    });
  };

  const handleNew = () => {
    runOrConfirm(() => {
      onNew();
      setMobileEditorOpen(true);
      setDirty(false);
    });
  };

  const handleSave = async () => {
    const saved = await onSave();
    if (saved !== false) setDirty(false);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MEDIA_IMAGE_MAX_SIZE) {
      setMediaError("Зображення завелике. Максимальний розмір — 10 МБ.");
      return;
    }
    if (file.type && !MEDIA_IMAGE_TYPES.has(file.type)) {
      setMediaError("Підтримуються лише JPEG, PNG, WebP або GIF.");
      return;
    }

    setMediaUploading(true);
    setMediaError(null);
    try {
      const uploaded = await MediaImageService.upload(file);
      setMediaImages((current) => [
        uploaded,
        ...current.filter((image) => image.id !== uploaded.id),
      ]);
      onImage(uploaded.url);
      setDirty(true);
    } catch (uploadError) {
      setMediaError(briefAlchemyError(uploadError, "Не вдалося завантажити зображення."));
    } finally {
      setMediaUploading(false);
    }
  };

  const deleteMediaImage = async (image: MediaImage) => {
    setMediaDeletingId(image.id);
    setMediaError(null);
    try {
      await MediaImageService.delete(image.id);
      setMediaImages((current) => current.filter((item) => item.id !== image.id));
      if (adminImageUrl === image.url) {
        onImage("");
        setDirty(true);
      }
    } catch (deleteError) {
      setMediaError(
        briefAlchemyError(
          deleteError,
          "Не вдалося видалити зображення. Можливо, воно вже використовується.",
        ),
      );
    } finally {
      setMediaDeletingId(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-black/5">
      <div className="border-b border-border bg-muted/15 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/12 text-violet-400">
              <Icon icon="material-symbols:science-outline" className="text-2xl" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Alchemy studio</h2>
                <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-300">
                  Admin
                </span>
              </div>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Керуйте базовими елементами та їхніми векторними рецептами.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <div className="rounded-xl border border-border bg-background/60 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Елементи</p>
              <p className="mt-0.5 text-sm font-semibold">{elements.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-background/60 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Стан</p>
              <p className={`mt-0.5 text-sm font-semibold ${dirty ? "text-amber-300" : "text-emerald-300"}`}>
                {dirty ? "Є зміни" : "Синхронізовано"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid min-h-[min(70svh,780px)] lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className={`${mobileEditorOpen ? "hidden lg:flex" : "flex"} min-h-0 flex-col border-b border-border p-4 lg:border-b-0 lg:border-r lg:p-5`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Каталог</p>
              <p className="mt-1 text-xs text-muted-foreground">Оберіть елемент для редагування</p>
            </div>
            <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">{elements.length}</span>
          </div>
          <div className="mb-4 flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Icon icon="material-symbols:search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={listQuery}
                onChange={(event) => setListQuery(event.target.value)}
                placeholder="Знайти елемент"
                className="h-10 rounded-xl pl-9"
                aria-label="Пошук елементів"
              />
            </div>
            <Button type="button" size="icon-md" onClick={handleNew} title="Створити елемент" aria-label="Створити елемент">
              <Icon icon="material-symbols:add" />
            </Button>
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
            {filteredElements.length ? filteredElements.map((element) => {
              const selected = adminElement?.id === element.id;
              return (
                <div key={element.id} className={`group flex items-center gap-1 rounded-xl border p-1 transition-colors ${selected ? "border-violet-400/30 bg-violet-500/10" : "border-transparent hover:border-border hover:bg-muted/50"}`}>
                  <button type="button" onClick={() => handleEdit(element)} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-2 text-left">
                    {element.imageUrl ? (
                      <img src={element.imageUrl} alt="" className="size-9 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${selected ? "bg-violet-500/20 text-violet-300" : "bg-muted text-muted-foreground"}`}>
                        <Icon icon="material-symbols:deployed-code-outline" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{element.name}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{element.description || "Без опису"}</span>
                    </span>
                    {selected && <Icon icon="material-symbols:chevron-right" className="shrink-0 text-violet-300" />}
                  </button>
                  <Button type="button" size="icon-xs" variant="ghost" className="text-muted-foreground hover:bg-red-500/10 hover:text-red-300" onClick={() => setDeleteTarget(element)} aria-label={`Видалити ${element.name}`}>
                    <Icon icon="material-symbols:delete-outline" />
                  </Button>
                </div>
              );
            }) : (
              <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center">
                <Icon icon="material-symbols:search-off" className="mb-2 text-2xl text-muted-foreground" />
                <p className="text-sm font-medium">Нічого не знайдено</p>
                <p className="mt-1 text-xs text-muted-foreground">Спробуйте інший запит.</p>
              </div>
            )}
          </div>
          <div className="mt-4 rounded-xl bg-muted/35 px-3 py-2.5 text-[11px] leading-4 text-muted-foreground">
            Видалення елемента також прибирає його з поточної алхімічної мапи.
          </div>
        </aside>

        <div className={`${mobileEditorOpen ? "flex" : "hidden lg:flex"} min-w-0 flex-col`}>
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Button type="button" size="icon-sm" variant="ghost" className="lg:hidden" onClick={() => setMobileEditorOpen(false)} aria-label="Повернутися до каталогу">
                <Icon icon="material-symbols:arrow-back" />
              </Button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{adminElement ? adminElement.name : "Новий елемент"}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{adminElement ? "Редагування базового елемента" : "Створіть новий елемент алхімії"}</p>
              </div>
            </div>
            {dirty && <span className="shrink-0 rounded-full bg-amber-400/12 px-2.5 py-1 text-[11px] font-medium text-amber-300">Не збережено</span>}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl space-y-5">
              <section className="rounded-2xl border border-border bg-background/45 p-4 sm:p-5">
                <div className="mb-4 flex items-start gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/12 text-violet-400"><Icon icon="material-symbols:badge-outline" /></span>
                  <div>
                    <h3 className="text-sm font-semibold">Ідентифікація</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Основні дані, які бачать користувачі.</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-1.5 text-sm font-medium">
                    Назва <span className="text-destructive">*</span>
                    <Input value={adminName} onChange={(event) => { onName(event.target.value); setDirty(true); }} placeholder="Наприклад, Світло" className="h-11 rounded-xl" />
                  </label>
                  <label className="grid gap-1.5 text-sm font-medium">
                    Опис
                    <Input value={adminDescription} onChange={(event) => { onDescription(event.target.value); setDirty(true); }} placeholder="Коротке пояснення елемента" className="h-11 rounded-xl" />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-background/45 p-4 sm:p-5">
                <div className="mb-4 flex items-start gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/12 text-sky-300"><Icon icon="material-symbols:image-outline" /></span>
                  <div>
                    <h3 className="text-sm font-semibold">Зображення</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Виберіть з медіатеки, завантажте файл або вставте URL.</p>
                  </div>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <ImagePreview url={adminImageUrl} />
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setMediaOpen(true)}>
                        <Icon icon="material-symbols:photo-library-outline" />
                        Медіатека
                      </Button>
                      <Button type="button" variant="outline" size="sm" disabled={mediaUploading} onClick={() => imageInputRef.current?.click()}>
                        <Icon icon={mediaUploading ? "svg-spinners:90-ring-with-bg" : "material-symbols:upload"} />
                        Завантажити
                      </Button>
                      {adminImageUrl && <Button type="button" variant="ghost" size="sm" onClick={() => { onImage(""); setDirty(true); }}><Icon icon="material-symbols:close" />Прибрати</Button>}
                    </div>
                    <Input value={adminImageUrl} onChange={(event) => { onImage(event.target.value); setDirty(true); }} placeholder="https://…" className="h-10 rounded-xl" aria-label="URL зображення" />
                    <p className="text-[11px] text-muted-foreground">JPEG, PNG, WebP або GIF до 10 МБ.</p>
                  </div>
                </div>
              </section>

              <section className={`rounded-2xl border p-4 sm:p-5 ${replaceVector ? "border-violet-400/35 bg-violet-500/[0.04]" : "border-border bg-background/45"}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/12 text-amber-300"><Icon icon="material-symbols:account-tree-outline" /></span>
                    <div>
                      <h3 className="text-sm font-semibold">Векторний рецепт</h3>
                      <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">Опишіть формулу вручну. Пошук і autocomplete вимкнені, щоб рецепт залишався прозорим і контрольованим.</p>
                    </div>
                  </div>
                  {adminElement && (
                    <Button type="button" size="sm" variant={replaceVector ? "default" : "outline"} onClick={() => { onReplace(!replaceVector); setDirty(true); }}>
                      <Icon icon={replaceVector ? "material-symbols:edit-note" : "material-symbols:lock-reset"} />
                      {replaceVector ? "Зберігати рецепт" : "Замінити вектор"}
                    </Button>
                  )}
                </div>
                {replaceVector ? (
                  <div className="mt-5 space-y-3">
                    <RecipeCodeEditor value={adminExpression} onChange={(value, cursor) => { onExpression(value, cursor); setDirty(true); }} />
                    <p className="text-xs leading-5 text-muted-foreground">Функції: <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-sky-300">element()</code>, <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-sky-300">anime()</code>, <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-sky-300">manga()</code>, <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-sky-300">normalize()</code>. Оператори: <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-amber-300">+ - * / ^</code>.</p>
                  </div>
                ) : (
                  <div className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-muted/25 px-3 py-3 text-sm text-muted-foreground">
                    <Icon icon="material-symbols:check-circle-outline" className="shrink-0 text-emerald-300" />
                    Поточний 256-вимірний вектор буде збережено без змін.
                  </div>
                )}
                {lastRecipe && <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground"><Icon icon="material-symbols:history" />Остання реакція: <span className="truncate font-medium text-foreground">{lastRecipe.label}</span></div>}
              </section>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border bg-card/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <Button type="button" variant="ghost" onClick={handleNew} disabled={saving}>Скинути форму</Button>
            <div className="flex items-center gap-3">
              {dirty && <span className="hidden text-xs text-muted-foreground sm:inline">Зміни ще не збережені</span>}
              <Button type="button" onClick={() => void handleSave()} disabled={saving || !adminName.trim() || (!adminElement && !replaceVector)}>
                <Icon icon={saving ? "svg-spinners:90-ring-with-bg" : "material-symbols:save-outline"} />
                {saving ? "Збереження…" : adminElement ? "Зберегти зміни" : "Створити елемент"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <MediaPicker
        open={mediaOpen}
        onOpenChange={setMediaOpen}
        images={mediaImages}
        selectedUrl={adminImageUrl}
        loading={mediaLoading}
        uploading={mediaUploading}
        deletingId={mediaDeletingId}
        error={mediaError}
        imageInputRef={imageInputRef}
        onRefresh={() => void loadMediaImages()}
        onUpload={(event) => void handleImageUpload(event)}
        onSelect={(url) => { onImage(url); setDirty(true); }}
        onDelete={setMediaDeleteTarget}
      />

      <AlertDialog open={Boolean(pendingAction)} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Відкинути незбережені зміни?</AlertDialogTitle>
            <AlertDialogDescription>Поточні зміни форми буде втрачено. Цю дію неможливо скасувати.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Залишитися</AlertDialogCancel>
            <AlertDialogAction onClick={() => { const action = pendingAction; setPendingAction(null); setDirty(false); action?.(); }}>Відкинути зміни</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити базовий елемент?</AlertDialogTitle>
            <AlertDialogDescription>«{deleteTarget?.name}» буде видалено з backend і поточної алхімічної мапи. Цю дію неможливо скасувати.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (deleteTarget) onDelete(deleteTarget); setDeleteTarget(null); }}>Видалити</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(mediaDeleteTarget)} onOpenChange={(open) => !open && setMediaDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити зображення?</AlertDialogTitle>
            <AlertDialogDescription>«{mediaDeleteTarget?.originalFilename}» буде видалено з медіатеки. Якщо зображення використовується елементом алхімії, backend відхилить операцію.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (mediaDeleteTarget) void deleteMediaImage(mediaDeleteTarget); setMediaDeleteTarget(null); }}>Видалити</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
