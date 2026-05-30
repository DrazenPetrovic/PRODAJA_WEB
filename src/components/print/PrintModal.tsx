import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { Printer, X, ZoomIn, ZoomOut } from "lucide-react";

const PRIMARY = "#0F766E";

const MM_TO_PX = 3.7795;

export interface PrintJob {
  title: string;
  component: React.ReactNode;
  orientation?: "portrait" | "landscape";
  defaultFormat?: "A4" | "A5";
  lockFormat?: boolean;
  lockOrientation?: boolean;
}

interface Props {
  job: PrintJob;
  onClose: () => void;
}

export function PrintModal({ job, onClose }: Props) {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    job.orientation ?? "portrait",
  );
  const [format, setFormat] = useState<"A4" | "A5">(job.defaultFormat ?? "A4");
  const [scale, setScale] = useState(0.62);

  useEffect(() => {
    setOrientation(job.orientation ?? "portrait");
    setFormat(job.defaultFormat ?? "A4");
  }, [job.title, job.orientation, job.defaultFormat]);

  const effectiveOrientation = job.lockOrientation
    ? (job.orientation ?? "portrait")
    : orientation;
  const effectiveFormat = job.lockFormat ? (job.defaultFormat ?? "A4") : format;

  const pageWidthMm =
    effectiveOrientation === "portrait"
      ? effectiveFormat === "A4"
        ? 210
        : 148
      : effectiveFormat === "A4"
        ? 297
        : 210;

  const pageHeightMm =
    effectiveOrientation === "portrait"
      ? effectiveFormat === "A4"
        ? 297
        : 210
      : effectiveFormat === "A4"
        ? 210
        : 148;

  const paperW = pageWidthMm * MM_TO_PX;

  const paperH = pageHeightMm * MM_TO_PX;

  const handlePrint = () => {
    document.getElementById("__print_iframe__")?.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "__print_iframe__";
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const frameWindow = iframe.contentWindow;
    const frameDocument = iframe.contentDocument;

    if (!frameWindow || !frameDocument) {
      iframe.remove();
      return;
    }

    frameDocument.open();
    frameDocument.write(
      `<!doctype html><html><head><meta charset="utf-8"></head><body><div id="__print_content__"></div></body></html>`,
    );
    frameDocument.close();

    const mountNode = frameDocument.getElementById("__print_content__");
    if (!mountNode) {
      iframe.remove();
      return;
    }

    const printRoot = createRoot(mountNode);
    flushSync(() => {
      printRoot.render(job.component);
    });

    const style = frameDocument.createElement("style");
    style.textContent = `@media print {
  @page { size: ${pageWidthMm}mm ${pageHeightMm}mm; margin: 0; }
  html, body {
    width: ${pageWidthMm}mm !important;
    height: ${pageHeightMm}mm !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    background: white !important;
  }
  #__print_content__ {
    display: block !important;
    width: ${pageWidthMm}mm !important;
    min-height: ${pageHeightMm}mm !important;
    margin: 0 !important;
    padding: 0 !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    background: white !important;
  }
}`;
    frameDocument.head.appendChild(style);

    const cleanup = () => {
      printRoot.unmount();
      iframe.remove();
      frameWindow.removeEventListener("afterprint", cleanup);
    };
    frameWindow.addEventListener("afterprint", cleanup);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          frameWindow.focus();
          frameWindow.print();
          // Fallback cleanup for drivers that do not dispatch afterprint reliably.
          setTimeout(cleanup, 1500);
        }, 80);
      });
    });
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white dark:bg-[#0f2320] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: 940, maxWidth: "95vw", height: "88vh" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-3.5 flex-shrink-0"
          style={{ background: PRIMARY }}
        >
          <div className="flex items-center gap-3 text-white">
            <Printer size={17} />
            <span className="font-semibold text-sm">{job.title}</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={19} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Preview */}
          <div className="flex-1 bg-gray-200 dark:bg-[#0a1e1c] overflow-auto p-8 flex justify-center items-start">
            <div
              style={{
                width: paperW * scale,
                height: paperH * scale,
                flexShrink: 0,
                overflow: "hidden",
                boxShadow: "0 4px 24px rgba(0,0,0,0.22)",
              }}
            >
              <div
                style={{
                  width: paperW,
                  height: paperH,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  background: "white",
                  overflow: "hidden",
                }}
              >
                {job.component}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="w-52 border-l border-gray-100 dark:border-[#1a3d38] flex flex-col p-5 gap-5 flex-shrink-0">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#4a7a74] mb-2.5">
                Zoom preview
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setScale((s) => Math.max(0.3, +(s - 0.1).toFixed(2)))
                  }
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-[#1e4a44] hover:bg-gray-100 dark:hover:bg-[#1a3d38] transition-all"
                >
                  <ZoomOut
                    size={14}
                    className="text-gray-500 dark:text-[#4a7a74]"
                  />
                </button>
                <span className="flex-1 text-center text-sm font-semibold text-gray-700 dark:text-[#c5e0db]">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={() =>
                    setScale((s) => Math.min(1.2, +(s + 0.1).toFixed(2)))
                  }
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-[#1e4a44] hover:bg-gray-100 dark:hover:bg-[#1a3d38] transition-all"
                >
                  <ZoomIn
                    size={14}
                    className="text-gray-500 dark:text-[#4a7a74]"
                  />
                </button>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#4a7a74] mb-2.5">
                Orijentacija
              </p>
              {(["portrait", "landscape"] as const).map((o) => (
                <label
                  key={o}
                  className="flex items-center gap-2 mb-2 cursor-pointer text-sm text-gray-700 dark:text-[#c5e0db] select-none"
                >
                  <input
                    type="radio"
                    name="orientation"
                    value={o}
                    checked={orientation === o}
                    onChange={() => setOrientation(o)}
                    disabled={job.lockOrientation}
                    className="accent-teal-600"
                  />
                  {o === "portrait" ? "Portrait" : "Landscape"}
                </label>
              ))}
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#4a7a74] mb-2.5">
                Format papira
              </p>
              {(["A4", "A5"] as const).map((f) => (
                <label
                  key={f}
                  className="flex items-center gap-2 mb-2 cursor-pointer text-sm text-gray-700 dark:text-[#c5e0db] select-none"
                >
                  <input
                    type="radio"
                    name="format"
                    value={f}
                    checked={format === f}
                    onChange={() => setFormat(f)}
                    disabled={job.lockFormat}
                    className="accent-teal-600"
                  />
                  {f}
                </label>
              ))}
            </div>

            <div className="mt-auto space-y-2">
              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
                style={{ background: PRIMARY }}
              >
                <Printer size={15} />
                Štampaj / PDF
              </button>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 rounded-xl text-sm font-medium text-gray-500 dark:text-[#4a7a74] border border-gray-200 dark:border-[#1e4a44] hover:bg-gray-50 dark:hover:bg-[#1a3d38] transition-all"
              >
                Zatvori
              </button>
            </div>

            <p className="text-[10px] text-gray-400 dark:text-[#4a7a74] text-center leading-relaxed">
              Za export u PDF izaberi "Spremi kao PDF" u sistemskom dijalogu
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
