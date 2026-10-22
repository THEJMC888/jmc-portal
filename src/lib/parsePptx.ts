import JSZip from "jszip";
import type { VisionSlide, SlideElement, SlideBackground } from "@/types";

// ─── Canvas dimensions (must match vision/page.tsx VW/VH) ───────────────────
const CANVAS_W = 1600;
const CANVAS_H = 900;

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ─── XML helpers ─────────────────────────────────────────────────────────────

function parseXml(str: string): Document {
  return new DOMParser().parseFromString(str, "application/xml");
}

function attr(el: Element, ...names: string[]): string {
  for (const n of names) {
    const v = el.getAttribute(n);
    if (v !== null) return v;
  }
  return "";
}

// Resolve namespaced attribute (tries both "ns:local" and "local")
function nsAttr(el: Element, ns: string, local: string): string {
  return el.getAttributeNS(ns, local) ?? el.getAttribute(`${ns}:${local}`) ?? el.getAttribute(local) ?? "";
}

// Get all descendants matching a tag (any namespace)
function byTag(node: Element | Document, tag: string): Element[] {
  const all = Array.from(node.getElementsByTagNameNS("*", tag));
  return all;
}

function firstByTag(node: Element | Document, tag: string): Element | null {
  return byTag(node, tag)[0] ?? null;
}

// ─── EMU → canvas pixel ──────────────────────────────────────────────────────

function emuToCanvas(
  emu: number,
  axis: "x" | "y",
  slideW: number,
  slideH: number
): number {
  return axis === "x"
    ? Math.round((emu / slideW) * CANVAS_W)
    : Math.round((emu / slideH) * CANVAS_H);
}

// ─── Color helpers ───────────────────────────────────────────────────────────

// Parse a DrawingML <a:srgbClr val="RRGGBB"/> or <a:sysClr lastClr="RRGGBB"/> or theme colour
function extractColorFromEl(colorEl: Element | null): string | undefined {
  if (!colorEl) return undefined;
  const srgb = firstByTag(colorEl, "srgbClr");
  if (srgb) {
    const v = attr(srgb, "val");
    if (v) return `#${v.toUpperCase()}`;
  }
  const sys = firstByTag(colorEl, "sysClr");
  if (sys) {
    const v = attr(sys, "lastClr");
    if (v) return `#${v.toUpperCase()}`;
  }
  return undefined;
}

// ─── Slide size ───────────────────────────────────────────────────────────────

async function getSlideSize(zip: JSZip): Promise<{ w: number; h: number }> {
  const presFile = zip.file("ppt/presentation.xml");
  if (!presFile) return { w: 12192000, h: 6858000 }; // default widescreen
  const text = await presFile.async("text");
  const doc = parseXml(text);
  const sldSz = firstByTag(doc, "sldSz");
  if (!sldSz) return { w: 12192000, h: 6858000 };
  const w = parseInt(attr(sldSz, "cx"), 10) || 12192000;
  const h = parseInt(attr(sldSz, "cy"), 10) || 6858000;
  return { w, h };
}

// ─── Image extraction ─────────────────────────────────────────────────────────

async function extractImage(
  zip: JSZip,
  slideDir: string,
  rId: string,
  relsXml: string
): Promise<string | undefined> {
  const relsDoc = parseXml(relsXml);
  const rels = byTag(relsDoc, "Relationship");
  const rel = rels.find((r) => attr(r, "Id") === rId);
  if (!rel) return undefined;

  const target = attr(rel, "Target");
  // Resolve relative path from slide directory
  let imgPath: string;
  if (target.startsWith("../")) {
    imgPath = `ppt/${target.slice(3)}`;
  } else if (target.startsWith("/")) {
    imgPath = target.slice(1);
  } else {
    imgPath = `${slideDir}/${target}`;
  }

  const imgFile = zip.file(imgPath);
  if (!imgFile) return undefined;

  const ext = imgPath.split(".").pop()?.toLowerCase() ?? "png";
  const mimeMap: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    bmp: "image/bmp",
    webp: "image/webp",
    svg: "image/svg+xml",
    emf: "image/x-emf",
    wmf: "image/x-wmf",
  };
  const mime = mimeMap[ext] ?? "image/png";
  if (mime === "image/x-emf" || mime === "image/x-wmf") return undefined; // skip legacy metafiles

  const b64 = await imgFile.async("base64");
  return `data:${mime};base64,${b64}`;
}

// ─── Background extraction ────────────────────────────────────────────────────

async function extractBackground(
  slideDoc: Document,
  zip: JSZip,
  slideDir: string,
  relsXml: string,
  slideW: number,
  slideH: number
): Promise<SlideBackground> {
  // Check for background shape (spTree) then fallback
  const bg = firstByTag(slideDoc, "bg");

  if (bg) {
    // Solid fill
    const solidFill = firstByTag(bg, "solidFill");
    if (solidFill) {
      const color = extractColorFromEl(solidFill);
      if (color) return { type: "color", color };
    }

    // Gradient fill
    const gradFill = firstByTag(bg, "gradFill");
    if (gradFill) {
      const stops = byTag(gradFill, "gs");
      if (stops.length >= 2) {
        const firstColor = extractColorFromEl(stops[0]) ?? "#08254D";
        const lastColor = extractColorFromEl(stops[stops.length - 1]) ?? "#040d1c";
        const linEl = firstByTag(gradFill, "lin");
        const angleAttr = linEl ? attr(linEl, "ang") : "5400000";
        // PPTX angle is in 1/60000 degrees, measured clockwise from north
        const pptxAngle = parseInt(angleAttr, 10) / 60000;
        const cssAngle = Math.round((90 - pptxAngle + 360) % 360);
        return { type: "gradient", gradient: { from: firstColor, to: lastColor, angle: cssAngle } };
      }
    }

    // Blip fill (image background)
    const blipFill = firstByTag(bg, "blipFill");
    if (blipFill) {
      const blip = firstByTag(blipFill, "blip");
      if (blip) {
        const rId = nsAttr(blip, "r", "embed") || attr(blip, "r:embed");
        if (rId) {
          const imgDataUrl = await extractImage(zip, slideDir, rId, relsXml);
          if (imgDataUrl) return { type: "image", imageDataUrl: imgDataUrl };
        }
      }
    }
  }

  // Default dark gradient matching the app's theme
  return { type: "gradient", gradient: { from: "#08254D", to: "#040d1c", angle: 160 } };
}

// ─── Text extraction ──────────────────────────────────────────────────────────

interface ParsedTextEl {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  color: string;
  textAlign: "left" | "center" | "right";
}

function extractTextFromTxBody(txBodyEl: Element): ParsedTextEl | null {
  const paras = byTag(txBodyEl, "p");
  const lines: string[] = [];

  let fontSize = 24;
  let fontWeight = "400";
  let fontStyle = "normal";
  let fontFamily = '"Inter", system-ui, sans-serif';
  let color = "#ffffff";
  let textAlign: "left" | "center" | "right" = "left";
  let firstRunParsed = false;

  for (const para of paras) {
    // Paragraph properties
    const pPr = firstByTag(para, "pPr");
    if (pPr) {
      const algn = attr(pPr, "algn");
      if (algn === "ctr") textAlign = "center";
      else if (algn === "r") textAlign = "right";
      else if (algn === "l") textAlign = "left";
    }

    const runs = byTag(para, "r");
    const lineText: string[] = [];

    for (const run of runs) {
      const rPr = firstByTag(run, "rPr");
      if (rPr && !firstRunParsed) {
        firstRunParsed = true;
        const szAttr = attr(rPr, "sz"); // in hundredths of a point
        if (szAttr) fontSize = Math.round(parseInt(szAttr, 10) / 100);
        const bAttr = attr(rPr, "b");
        if (bAttr === "1" || bAttr === "true") fontWeight = "700";
        const iAttr = attr(rPr, "i");
        if (iAttr === "1" || iAttr === "true") fontStyle = "italic";

        // Font face
        const latin = firstByTag(rPr, "latin");
        if (latin) {
          const typeface = attr(latin, "typeface");
          if (typeface && typeface !== "+mj-lt" && typeface !== "+mn-lt") {
            fontFamily = `"${typeface}", sans-serif`;
          }
        }

        // Color
        const solidFill = firstByTag(rPr, "solidFill");
        const c = extractColorFromEl(solidFill);
        if (c) color = c;
      }

      const tEls = byTag(run, "t");
      for (const t of tEls) {
        lineText.push(t.textContent ?? "");
      }
    }

    // Handle line break elements
    const brEls = byTag(para, "br");

    const paraText = lineText.join("");
    if (paraText || brEls.length > 0) lines.push(paraText);
  }

  const text = lines.join("\n").trim();
  if (!text) return null;

  // Clamp font size to reasonable range
  fontSize = Math.max(12, Math.min(fontSize, 200));

  return { text, fontFamily, fontSize, fontWeight, fontStyle, color, textAlign };
}

// ─── Shape → SlideElement ─────────────────────────────────────────────────────

async function parseShape(
  spEl: Element,
  zip: JSZip,
  slideDir: string,
  relsXml: string,
  slideW: number,
  slideH: number
): Promise<SlideElement | null> {
  const toX = (v: number) => emuToCanvas(v, "x", slideW, slideH);
  const toY = (v: number) => emuToCanvas(v, "y", slideW, slideH);

  // Position and size from spPr/xfrm
  const xfrm = firstByTag(spEl, "xfrm");
  if (!xfrm) return null;

  const offEl = firstByTag(xfrm, "off");
  const extEl = firstByTag(xfrm, "ext");
  if (!offEl || !extEl) return null;

  const x = toX(parseInt(attr(offEl, "x") || "0", 10));
  const y = toY(parseInt(attr(offEl, "y") || "0", 10));
  const width = toX(parseInt(attr(extEl, "cx") || "0", 10));
  const height = toY(parseInt(attr(extEl, "cy") || "0", 10));

  if (width <= 0 || height <= 0) return null;

  // zIndex from nvSpPr/cNvPr id attribute
  const cNvPr = firstByTag(spEl, "cNvPr");
  const zIndex = parseInt(attr(cNvPr ?? spEl, "id") || "1", 10);

  // ── Text shape ────────────────────────────────────────────────────────────
  const txBody = firstByTag(spEl, "txBody");
  if (txBody) {
    const parsed = extractTextFromTxBody(txBody);
    if (!parsed || !parsed.text) return null;

    return {
      id: uid(),
      type: "text",
      x, y, width, height, zIndex,
      text: parsed.text,
      fontFamily: parsed.fontFamily,
      fontSize: parsed.fontSize,
      fontWeight: parsed.fontWeight,
      fontStyle: parsed.fontStyle,
      color: parsed.color,
      textAlign: parsed.textAlign,
      textShadow: false,
    };
  }

  return null;
}

// ─── Picture → SlideElement ───────────────────────────────────────────────────

async function parsePicture(
  picEl: Element,
  zip: JSZip,
  slideDir: string,
  relsXml: string,
  slideW: number,
  slideH: number
): Promise<SlideElement | null> {
  const toX = (v: number) => emuToCanvas(v, "x", slideW, slideH);
  const toY = (v: number) => emuToCanvas(v, "y", slideW, slideH);

  const xfrm = firstByTag(picEl, "xfrm");
  if (!xfrm) return null;

  const offEl = firstByTag(xfrm, "off");
  const extEl = firstByTag(xfrm, "ext");
  if (!offEl || !extEl) return null;

  const x = toX(parseInt(attr(offEl, "x") || "0", 10));
  const y = toY(parseInt(attr(offEl, "y") || "0", 10));
  const width = toX(parseInt(attr(extEl, "cx") || "0", 10));
  const height = toY(parseInt(attr(extEl, "cy") || "0", 10));

  if (width <= 0 || height <= 0) return null;

  const cNvPr = firstByTag(picEl, "cNvPr");
  const zIndex = parseInt(attr(cNvPr ?? picEl, "id") || "1", 10);

  // Find the image rId
  const blipFill = firstByTag(picEl, "blipFill");
  if (!blipFill) return null;
  const blip = firstByTag(blipFill, "blip");
  if (!blip) return null;
  const rId = nsAttr(blip, "r", "embed") || attr(blip, "r:embed");
  if (!rId) return null;

  const imageDataUrl = await extractImage(zip, slideDir, rId, relsXml);
  if (!imageDataUrl) return null;

  return {
    id: uid(),
    type: "image",
    x, y, width, height, zIndex,
    imageDataUrl,
    objectFit: "contain",
  };
}

// ─── Main: parse a single slide ───────────────────────────────────────────────

async function parseSlide(
  zip: JSZip,
  slidePath: string,
  slideW: number,
  slideH: number
): Promise<VisionSlide> {
  const slideDir = slidePath.split("/").slice(0, -1).join("/");
  const slideFile = zip.file(slidePath);
  const text = slideFile ? await slideFile.async("text") : "<p:sld/>";

  // Load rels file
  const fileName = slidePath.split("/").pop()!;
  const relsPath = `${slideDir}/_rels/${fileName}.rels`;
  const relsFile = zip.file(relsPath);
  const relsXml = relsFile ? await relsFile.async("text") : "<Relationships/>";

  const doc = parseXml(text);
  const elements: SlideElement[] = [];

  // Background
  const background = await extractBackground(doc, zip, slideDir, relsXml, slideW, slideH);

  // Shapes (sp elements = text boxes, auto shapes, etc.)
  const spTree = firstByTag(doc, "spTree");
  if (spTree) {
    const shapes = byTag(spTree, "sp");
    for (const sp of shapes) {
      const el = await parseShape(sp, zip, slideDir, relsXml, slideW, slideH);
      if (el) elements.push(el);
    }

    // Pictures
    const pics = byTag(spTree, "pic");
    for (const pic of pics) {
      const el = await parsePicture(pic, zip, slideDir, relsXml, slideW, slideH);
      if (el) elements.push(el);
    }
  }

  // Sort by zIndex so higher-indexed elements are in front
  elements.sort((a, b) => a.zIndex - b.zIndex);

  return {
    id: uid(),
    background,
    elements,
    kenBurnsVariant: 0,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function parsePptxFile(file: File): Promise<VisionSlide[]> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const slideSize = await getSlideSize(zip);

  // Find all slide files in order
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/(\d+)\.xml$/)?.[1] ?? "0", 10);
      const numB = parseInt(b.match(/(\d+)\.xml$/)?.[1] ?? "0", 10);
      return numA - numB;
    });

  if (slideFiles.length === 0) {
    throw new Error("No slides found in this PPTX file.");
  }

  const slides = await Promise.all(
    slideFiles.map((path) => parseSlide(zip, path, slideSize.w, slideSize.h))
  );

  return slides;
}
