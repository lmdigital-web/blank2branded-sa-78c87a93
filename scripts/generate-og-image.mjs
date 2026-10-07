#!/usr/bin/env node
// Generate the Open Graph / Twitter card image as a real PNG.
//
// Why this exists: scripts/prerender-routes.ts and prerender-blog.ts fall back to
// /og-default.jpg, and index.html points LocalBusiness.image at /og-image.jpg.
// Neither file was ever committed, so on Cloudflare Pages the SPA fallback
// (`/* /index.html 200`) answered both with text/html — every social share and
// 97 pages' og:image pointed at a soft-404.
//
// No image library is available in this project, so the PNG is encoded directly
// with zlib and text is drawn from a small built-in 5x7 bitmap font.
//
//   node scripts/generate-og-image.mjs
//
// Writes public/og-default.png and public/og-image.png (1200x630).

import { deflateSync } from "node:zlib"
import { writeFileSync } from "node:fs"
import { join } from "node:path"

const W = 1200
const H = 630

// ---- tiny 5x7 bitmap font (uppercase + digits + a little punctuation) -------
const GLYPHS = {
  A: "01110 10001 10001 11111 10001 10001 10001",
  B: "11110 10001 10001 11110 10001 10001 11110",
  C: "01111 10000 10000 10000 10000 10000 01111",
  D: "11110 10001 10001 10001 10001 10001 11110",
  E: "11111 10000 10000 11110 10000 10000 11111",
  F: "11111 10000 10000 11110 10000 10000 10000",
  G: "01111 10000 10000 10111 10001 10001 01111",
  H: "10001 10001 10001 11111 10001 10001 10001",
  I: "11111 00100 00100 00100 00100 00100 11111",
  J: "00111 00010 00010 00010 00010 10010 01100",
  K: "10001 10010 10100 11000 10100 10010 10001",
  L: "10000 10000 10000 10000 10000 10000 11111",
  M: "10001 11011 10101 10101 10001 10001 10001",
  N: "10001 11001 10101 10011 10001 10001 10001",
  O: "01110 10001 10001 10001 10001 10001 01110",
  P: "11110 10001 10001 11110 10000 10000 10000",
  Q: "01110 10001 10001 10001 10101 10010 01101",
  R: "11110 10001 10001 11110 10100 10010 10001",
  S: "01111 10000 10000 01110 00001 00001 11110",
  T: "11111 00100 00100 00100 00100 00100 00100",
  U: "10001 10001 10001 10001 10001 10001 01110",
  V: "10001 10001 10001 10001 10001 01010 00100",
  W: "10001 10001 10001 10101 10101 11011 10001",
  X: "10001 10001 01010 00100 01010 10001 10001",
  Y: "10001 10001 01010 00100 00100 00100 00100",
  Z: "11111 00001 00010 00100 01000 10000 11111",
  0: "01110 10001 10011 10101 11001 10001 01110",
  1: "00100 01100 00100 00100 00100 00100 01110",
  2: "01110 10001 00001 00110 01000 10000 11111",
  3: "11110 00001 00001 01110 00001 00001 11110",
  4: "00010 00110 01010 10010 11111 00010 00010",
  5: "11111 10000 11110 00001 00001 10001 01110",
  6: "00110 01000 10000 11110 10001 10001 01110",
  7: "11111 00001 00010 00100 01000 01000 01000",
  8: "01110 10001 10001 01110 10001 10001 01110",
  9: "01110 10001 10001 01111 00001 00010 01100",
  "&": "01100 10010 10100 01000 10101 10010 01101",
  "|": "00100 00100 00100 00100 00100 00100 00100",
  ".": "00000 00000 00000 00000 00000 01100 01100",
  "-": "00000 00000 00000 11111 00000 00000 00000",
  "'": "00100 00100 00000 00000 00000 00000 00000",
  ":": "00000 01100 01100 00000 01100 01100 00000",
  " ": "00000 00000 00000 00000 00000 00000 00000",
}

function glyph(ch) {
  return GLYPHS[ch] ?? GLYPHS[ch.toUpperCase()] ?? GLYPHS[" "]
}
function textWidth(text, scale, tracking = 1) {
  return text.length * (5 * scale + tracking * scale) - tracking * scale
}

// ---- canvas -----------------------------------------------------------------
const px = Buffer.alloc(W * H * 3)

// brand gradient: deep charcoal -> magenta, matching the site palette
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const t = (x / W) * 0.65 + (y / H) * 0.35
    const r = Math.round(24 + t * 150)
    const g = Math.round(20 + t * 20)
    const b = Math.round(38 + t * 110)
    const i = (y * W + x) * 3
    px[i] = r
    px[i + 1] = g
    px[i + 2] = b
  }
}

function setPx(x, y, [r, g, b]) {
  if (x < 0 || y < 0 || x >= W || y >= H) return
  const i = (y * W + x) * 3
  px[i] = r
  px[i + 1] = g
  px[i + 2] = b
}

function rect(x0, y0, w, h, colour) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) setPx(x, y, colour)
}

function drawText(text, x, y, scale, colour, tracking = 1) {
  let cx = x
  for (const ch of text) {
    const rows = glyph(ch).split(" ")
    for (let ry = 0; ry < rows.length; ry++) {
      for (let rx = 0; rx < rows[ry].length; rx++) {
        if (rows[ry][rx] === "1") rect(cx + rx * scale, y + ry * scale, scale, scale, colour)
      }
    }
    cx += (5 + tracking) * scale
  }
}

// ---- compose ----------------------------------------------------------------
const WHITE = [255, 255, 255]
const CYAN = [34, 224, 238]
const MAGENTA = [236, 72, 153]

// accent bars
rect(0, 0, W, 10, MAGENTA)
rect(0, H - 10, W, 10, CYAN)

const title = "BLANK2BRANDED"
const titleScale = 14
const titleW = textWidth(title, titleScale)
drawText(title, Math.round((W - titleW) / 2), 190, titleScale, WHITE)

const sub = "DTF TRANSFERS & BLANK APPAREL"
const subScale = 5
const subW = textWidth(sub, subScale)
drawText(sub, Math.round((W - subW) / 2), 320, subScale, CYAN)

const loc = "MBOMBELA (NELSPRUIT) MPUMALANGA | SOUTH AFRICA"
const locScale = 4
const locW = textWidth(loc, locScale)
drawText(loc, Math.round((W - locW) / 2), 380, locScale, [225, 220, 235])

const site = "BLANK2BRANDED.CO.ZA"
const siteScale = 5
const siteW = textWidth(site, siteScale)
drawText(site, Math.round((W - siteW) / 2), 470, siteScale, WHITE)

// ---- PNG encode -------------------------------------------------------------
function crc32(buf) {
  let c
  const table = crc32.table || (crc32.table = (() => {
    const t = new Int32Array(256)
    for (let n = 0; n < 256; n++) {
      c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[n] = c
    }
    return t
  })())
  let crc = -1
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff]
  return (crc ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, "ascii"), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(W, 0)
ihdr.writeUInt32BE(H, 4)
ihdr[8] = 8 // bit depth
ihdr[9] = 2 // colour type: truecolour RGB
ihdr[10] = 0
ihdr[11] = 0
ihdr[12] = 0

// each scanline is prefixed with filter byte 0
const raw = Buffer.alloc(H * (W * 3 + 1))
for (let y = 0; y < H; y++) {
  raw[y * (W * 3 + 1)] = 0
  px.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3)
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
])

for (const name of ["og-default.png", "og-image.png"]) {
  writeFileSync(join("public", name), png)
  console.log(`wrote public/${name} (${W}x${H}, ${(png.length / 1024).toFixed(0)} KB)`)
}