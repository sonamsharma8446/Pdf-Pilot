import { useEffect, useReducer, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;

const THUMBNAIL_MAX_WIDTH = 130;

export interface PageThumbnail {
  pageNumber: number;
  dataUrl: string | null;
  isLoading: boolean;
  aspectRatio: number;
}

interface State {
  items: PageThumbnail[];
  pageCount: number | null;
  isLoading: boolean;
}

type Action =
  | { type: "RESET" }
  | { type: "START"; count: number }
  | { type: "RESOLVE"; pageNumber: number; dataUrl: string; aspectRatio: number }
  | { type: "FAIL"; pageNumber: number }
  | { type: "DONE" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "RESET":
      return { items: [], pageCount: null, isLoading: false };
    case "START":
      return {
        isLoading: true,
        pageCount: action.count,
        items: Array.from({ length: action.count }, (_, i) => ({
          pageNumber: i + 1,
          dataUrl: null,
          isLoading: true,
          aspectRatio: 1.414,
        })),
      };
    case "RESOLVE":
      return {
        ...state,
        items: state.items.map((t) =>
          t.pageNumber === action.pageNumber
            ? { ...t, dataUrl: action.dataUrl, aspectRatio: action.aspectRatio, isLoading: false }
            : t
        ),
      };
    case "FAIL":
      return {
        ...state,
        items: state.items.map((t) =>
          t.pageNumber === action.pageNumber ? { ...t, isLoading: false } : t
        ),
      };
    case "DONE":
      return { ...state, isLoading: false };
  }
}

export function usePdfThumbnails(file: File | null) {
  const [state, dispatch] = useReducer(reducer, { items: [], pageCount: null, isLoading: false });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();

    if (!file) {
      dispatch({ type: "RESET" });
      return;
    }

    const controller = new AbortController();
    
    abortRef.current = controller;

    void (async () => {
      let loadingTask: ReturnType<typeof pdfjsLib.getDocument> | null = null;
      try {
        const arrayBuffer = await file.arrayBuffer();
        if (controller.signal.aborted) return;

        loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdf = await loadingTask.promise;
        if (controller.signal.aborted) return;

        const count = pdf.numPages;
        dispatch({ type: "START", count });

        for (let pageNum = 1; pageNum <= count; pageNum++) {
          if (controller.signal.aborted) break;
          try {
            const page = await pdf.getPage(pageNum);
            if (controller.signal.aborted) { page.cleanup(); break; }

            const baseViewport = page.getViewport({ scale: 1 });
            const scale = THUMBNAIL_MAX_WIDTH / baseViewport.width;
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement("canvas");
            canvas.width = Math.round(viewport.width);
            canvas.height = Math.round(viewport.height);
            const ctx = canvas.getContext("2d");
            if (ctx) {
              await page.render({ canvas, canvasContext: ctx, viewport }).promise;
            }
            if (controller.signal.aborted) { page.cleanup(); break; }

            dispatch({
              type: "RESOLVE",
              pageNumber: pageNum,
              dataUrl: canvas.toDataURL("image/jpeg", 0.82),
              aspectRatio: viewport.height / viewport.width,
            });
            page.cleanup();
          } catch {
            dispatch({ type: "FAIL", pageNumber: pageNum });
          }
        }
      } finally {
        if (loadingTask) await loadingTask.destroy();
        if (!controller.signal.aborted) dispatch({ type: "DONE" });
      }
    })();

    return () => { controller.abort(); };
  }, [file]);

  return { thumbnails: state.items, pageCount: state.pageCount, isLoadingThumbnails: state.isLoading };
}
