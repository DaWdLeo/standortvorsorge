/*
 * Minimaler ZIP-Leser (nur Lesen) für .xlsx-Dateien im Browser. Keine externen Bibliotheken.
 * Deflate wird vom Browser selbst entpackt (DecompressionStream "deflate-raw").
 * Schutz: Grenzen für Anzahl Einträge und entpackte Größe (gegen "ZIP-Bomben"), kein ZIP64.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HavarieZip = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const LIMITS = { maxEntries: 2000, maxEntryBytes: 40 * 1024 * 1024 };

  function u16(b, o) { return b[o] | (b[o + 1] << 8); }
  function u32(b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; }
  function utf8(bytes) { return new TextDecoder('utf-8').decode(bytes); }

  /** Liest das Inhaltsverzeichnis. Gibt Map<Name, Eintrag> zurück. */
  function list(input) {
    const b = input instanceof Uint8Array ? input : new Uint8Array(input);
    if (b.length < 22) throw new Error('Datei ist zu klein für eine .xlsx-Datei.');
    let eocd = -1;
    for (let i = b.length - 22; i >= Math.max(0, b.length - 22 - 65535); i--) {
      if (u32(b, i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('Das ist keine gültige .xlsx-Datei (Inhaltsverzeichnis nicht gefunden).');
    const total = u16(b, eocd + 10), cdSize = u32(b, eocd + 12), cdOff = u32(b, eocd + 16);
    if (total === 0xffff || cdOff === 0xffffffff || cdSize === 0xffffffff) throw new Error('ZIP64 wird nicht unterstützt. Bitte als CSV speichern.');
    if (total > LIMITS.maxEntries) throw new Error('Die Datei enthält zu viele Einträge.');
    const entries = new Map();
    let p = cdOff;
    for (let i = 0; i < total; i++) {
      if (p + 46 > b.length || u32(b, p) !== 0x02014b50) throw new Error('Beschädigtes Inhaltsverzeichnis.');
      const flags = u16(b, p + 8), method = u16(b, p + 10);
      const compSize = u32(b, p + 20), size = u32(b, p + 24);
      const nameLen = u16(b, p + 28), extraLen = u16(b, p + 30), commentLen = u16(b, p + 32), localOff = u32(b, p + 42);
      const name = utf8(b.subarray(p + 46, p + 46 + nameLen));
      entries.set(name, { name, flags, method, compSize, size, localOff });
      p += 46 + nameLen + extraLen + commentLen;
    }
    return entries;
  }

  async function inflateRaw(bytes, limit) {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('Dieser Browser kann .xlsx-Dateien nicht lesen. Bitte die Datei als CSV speichern oder einen aktuellen Browser verwenden.');
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    const reader = stream.getReader();
    const chunks = [];
    let total = 0;
    for (;;) {
      const r = await reader.read();
      if (r.done) break;
      total += r.value.length;
      if (total > limit) { try { await reader.cancel(); } catch (e) { /* ignorieren */ } throw new Error('Die Datei ist entpackt zu groß.'); }
      chunks.push(r.value);
    }
    const out = new Uint8Array(total);
    let o = 0;
    chunks.forEach(c => { out.set(c, o); o += c.length; });
    return out;
  }

  /** Entpackt einen Eintrag und gibt die Bytes zurück. */
  async function read(input, entry) {
    const b = input instanceof Uint8Array ? input : new Uint8Array(input);
    if (entry.flags & 1) throw new Error('Verschlüsselte Dateien werden nicht unterstützt.');
    if (entry.size > LIMITS.maxEntryBytes) throw new Error('Die Datei ist entpackt zu groß.');
    const o = entry.localOff;
    if (o + 30 > b.length || u32(b, o) !== 0x04034b50) throw new Error('Beschädigter Eintrag: ' + entry.name);
    const start = o + 30 + u16(b, o + 26) + u16(b, o + 28);
    const raw = b.subarray(start, start + entry.compSize);
    if (entry.method === 0) return raw.slice();
    if (entry.method === 8) return inflateRaw(raw, LIMITS.maxEntryBytes);
    throw new Error('Nicht unterstütztes Kompressionsverfahren.');
  }

  async function readText(input, entries, name) {
    const e = entries.get(name);
    return e ? utf8(await read(input, e)) : null;
  }

  return { list, read, readText, LIMITS };
}));
