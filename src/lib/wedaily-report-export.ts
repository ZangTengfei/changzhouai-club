import type { AdminWeDailyReportExportTemplate } from "@/lib/admin/wedaily-admin";

export async function downloadWeDailyReportTemplatePng(
  template: AdminWeDailyReportExportTemplate,
  fallbackFileName: string,
) {
  if (document.fonts) {
    await document.fonts.ready;
  }

  const style = document.createElement("style");
  style.textContent = template.css;
  document.head.append(style);

  const host = document.createElement("div");
  host.className = "export-measure";
  host.innerHTML = template.html;
  document.body.append(host);

  try {
    await nextFrame();

    const sheet = host.querySelector<HTMLElement>(".daily-sheet");
    if (!sheet) {
      throw new Error("daily_sheet_not_found");
    }

    const width = template.width || 1080;
    const height = Math.ceil(sheet.scrollHeight);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));

    const foreign = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
    foreign.setAttribute("width", "100%");
    foreign.setAttribute("height", "100%");

    const wrapper = document.createElement("div");
    wrapper.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
    wrapper.innerHTML = `<style>${template.css}</style>${host.innerHTML}`;
    foreign.append(wrapper);
    svg.append(foreign);

    const svgText = new XMLSerializer().serializeToString(svg);
    const image = new Image();
    image.decoding = "async";
    const imageLoaded = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("report_svg_image_load_failed"));
    });
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
    await imageLoaded;

    const maxPixelRatio = template.maxPixelRatio || 2;
    const maxCanvasEdge = template.maxCanvasEdge || 30000;
    const ratio = Math.max(1, Math.min(maxPixelRatio, maxCanvasEdge / Math.max(height, 1)));
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(width * ratio);
    canvas.height = Math.ceil(height * ratio);

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("canvas_context_unavailable");
    }

    context.scale(ratio, ratio);
    context.drawImage(image, 0, 0);

    const link = document.createElement("a");
    link.download = template.fileName || fallbackFileName;
    link.href = canvas.toDataURL("image/png");
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    host.remove();
    style.remove();
  }
}

function nextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}
