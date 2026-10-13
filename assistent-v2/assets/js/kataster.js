/*
 * Gefahrstoffkataster einlesen: CSV und Excel (.xlsx), Spaltenerkennung, Abgleich mit den Stammdaten.
 * Läuft vollständig im Browser. Die Datei wird nicht hochgeladen.
 *
 * Grundsatz: Ein Stoff wird NUR dann mit den Stammdaten verknüpft, wenn Kataster-Nummer oder Name eindeutig übereinstimmen.
 * Alles andere bleibt "nicht in den Stammdaten" und führt in der Auswertung zu "Fachprüfung nötig".
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./zip.js'));
  else root.HavarieKataster = factory(root.HavarieZip);
}(typeof self !== 'undefined' ? self : this, function (Zip) {
  'use strict';

  const MAX_ROWS = 5000, MAX_COLS = 80, MAX_BYTES = 25 * 1024 * 1024;

  // ---------- Text-Hilfen ----------
  function clean(v, max) {
    let s = (v === null || v === undefined) ? '' : String(v);
    s = s.replace(/[\u0000-\u0008\u000B-\u001F\u007F​-‏‪-‮⁦-⁩]/g, ' ').replace(/\s+/g, ' ').trim();
    return s.length > (max || 200) ? s.slice(0, max || 200) : s;
  }
  function fold(s) {
    return String(s).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .normalize('NFKD').replace(/[̀-ͯ]/g, '');
  }
  const headKey = s => fold(s).replace(/[^a-z0-9]/g, '');

  function decodeText(buffer) {
    const b = new Uint8Array(buffer);
    if (b.length >= 3 && b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF) return new TextDecoder('utf-8').decode(b.subarray(3));
    if (b.length >= 2 && b[0] === 0xFF && b[1] === 0xFE) return new TextDecoder('utf-16le').decode(b.subarray(2));
    if (b.length >= 2 && b[0] === 0xFE && b[1] === 0xFF) return new TextDecoder('utf-16be').decode(b.subarray(2));
    try { return new TextDecoder('utf-8', { fatal: true }).decode(b); } catch (e) { return new TextDecoder('windows-1252').decode(b); }
  }

  // ---------- CSV ----------
  function detectDelimiter(text) {
    // Häufigkeit der Spaltenzahl je Trennzeichen über die ersten Zeilen (Zeilenumbrüche in Zellen stören so kaum)
    const lines = text.split(/\r?\n/).filter(l => l.trim() !== '').slice(0, 12);
    let best = ';', bestGroup = 0, bestCount = 0;
    [';', ',', '\t', '|'].forEach(d => {
      const groups = new Map();
      lines.forEach(l => {
        let n = 0, q = false;
        for (const ch of l) { if (ch === '"') q = !q; else if (ch === d && !q) n++; }
        if (n > 0) groups.set(n, (groups.get(n) || 0) + 1);
      });
      groups.forEach((size, count) => {
        if (size > bestGroup || (size === bestGroup && count > bestCount)) { bestGroup = size; bestCount = count; best = d; }
      });
    });
    return best;
  }
  function parseCSV(text) {
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    const d = detectDelimiter(text);
    const rows = [];
    let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch;
      } else if (ch === '"' && cell === '') q = true;
      else if (ch === d) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); cell = '';
        if (row.some(c => c.trim() !== '')) rows.push(row);
        row = [];
        if (rows.length > MAX_ROWS + 20) throw new Error('Die Datei hat zu viele Zeilen (Grenze ' + MAX_ROWS + ').');
      } else cell += ch;
    }
    row.push(cell);
    if (row.some(c => c.trim() !== '')) rows.push(row);
    return rows.map(r => r.slice(0, MAX_COLS));
  }

  // ---------- XLSX ----------
  function unxml(s) {
    return s.replace(/&#x([0-9a-fA-F]+);/g, (m, h) => safeCP(parseInt(h, 16))).replace(/&#(\d+);/g, (m, n) => safeCP(parseInt(n, 10)))
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
  }
  function safeCP(n) { try { return n > 0 && n <= 0x10FFFF ? String.fromCodePoint(n) : ''; } catch (e) { return ''; } }
  function textsOf(xml) {
    let out = '';
    const re = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>|<t\/>/g;
    let m;
    while ((m = re.exec(xml))) out += m[1] ? unxml(m[1]) : '';
    return out;
  }
  function colIndex(ref) {
    const letters = /^[A-Z]+/.exec(ref);
    if (!letters) return -1;
    let n = 0;
    for (const ch of letters[0]) n = n * 26 + (ch.charCodeAt(0) - 64);
    return n - 1;
  }
  function attr(tag, name) {
    const m = new RegExp('\\b' + name + '="([^"]*)"').exec(tag);
    return m ? unxml(m[1]) : '';
  }

  async function parseXLSX(buffer) {
    if (buffer.byteLength > MAX_BYTES) throw new Error('Die Datei ist zu groß.');
    const bytes = new Uint8Array(buffer);
    const entries = Zip.list(bytes);
    if (!entries.has('xl/workbook.xml')) throw new Error('Das ist keine Excel-Arbeitsmappe (.xlsx). Alte .xls-Dateien bitte als .xlsx oder CSV speichern.');
    const wb = await Zip.readText(bytes, entries, 'xl/workbook.xml');
    const rels = (await Zip.readText(bytes, entries, 'xl/_rels/workbook.xml.rels')) || '';
    // erstes sichtbares Blatt
    let target = null;
    const sheetTags = wb.match(/<sheet\b[^>]*>/g) || [];
    for (const tag of sheetTags) {
      if (/state="(hidden|veryHidden)"/.test(tag)) continue;
      const rid = attr(tag, 'r:id');
      const relTag = (rels.match(/<Relationship\b[^>]*>/g) || []).find(t => attr(t, 'Id') === rid);
      if (relTag) { target = attr(relTag, 'Target'); break; }
    }
    if (!target) target = 'worksheets/sheet1.xml';
    const path = target.startsWith('/') ? target.slice(1) : 'xl/' + target.replace(/^\.\//, '');
    const sheetXml = await Zip.readText(bytes, entries, path);
    if (!sheetXml) throw new Error('Arbeitsblatt nicht gefunden.');

    const shared = [];
    const sst = await Zip.readText(bytes, entries, 'xl/sharedStrings.xml');
    if (sst) {
      const re = /<si\b[^>]*>([\s\S]*?)<\/si>|<si\b[^>]*\/>/g;
      let m;
      while ((m = re.exec(sst))) shared.push(m[1] ? textsOf(m[1].replace(/<rPh\b[\s\S]*?<\/rPh>/g, '')) : '');
    }

    const rows = [];
    const rowRe = /<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g;
    let rm;
    while ((rm = rowRe.exec(sheetXml))) {
      const rowNo = parseInt(attr(rm[1], 'r'), 10) || (rows.length + 1);
      if (rowNo > MAX_ROWS + 20) throw new Error('Die Datei hat zu viele Zeilen (Grenze ' + MAX_ROWS + ').');
      const cells = [];
      const body = rm[2] || '';
      const cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
      let cm;
      while ((cm = cellRe.exec(body))) {
        const ci = colIndex(attr(cm[1], 'r'));
        if (ci < 0 || ci >= MAX_COLS) continue;
        const t = attr(cm[1], 't'), inner = cm[2] || '';
        let val = '';
        if (t === 'inlineStr') val = textsOf(inner);
        else {
          const v = /<v>([\s\S]*?)<\/v>/.exec(inner);
          if (v) {
            if (t === 's') val = shared[parseInt(v[1], 10)] || '';
            else if (t === 'b') val = v[1] === '1' ? 'Ja' : 'Nein';
            else if (t === 'e') val = '';
            else val = unxml(v[1]);
          }
        }
        cells[ci] = val;
      }
      if (cells.some(c => c !== undefined && String(c).trim() !== '')) {
        while (rows.length < rowNo - 1) rows.push([]);
        rows[rowNo - 1] = Array.from(cells, c => (c === undefined ? '' : c));
      }
    }
    return rows.filter(r => r && r.length);
  }

  async function readFile(fileOrBuffer, name) {
    const buffer = fileOrBuffer.arrayBuffer ? await fileOrBuffer.arrayBuffer() : fileOrBuffer;
    const fname = String(name || fileOrBuffer.name || '').toLowerCase();
    if (buffer.byteLength > MAX_BYTES) throw new Error('Die Datei ist zu groß (Grenze 25 MB).');
    const head = new Uint8Array(buffer.slice(0, 4));
    const isZip = head[0] === 0x50 && head[1] === 0x4B;
    if (fname.endsWith('.xls') && !isZip) throw new Error('Das alte Excel-Format (.xls) wird nicht gelesen. Bitte als .xlsx oder CSV speichern.');
    if (isZip || fname.endsWith('.xlsx')) return parseXLSX(buffer);
    return parseCSV(decodeText(buffer));
  }

  // ---------- Spaltenerkennung ----------
  const FIELDS = [
    { key: 'name', label: 'Produktname', required: true, exact: ['produktname', 'produkt', 'bezeichnung', 'stoff', 'stoffname', 'handelsname', 'name', 'gefahrstoff', 'artikelbezeichnung', 'materialbezeichnung', 'materialkurztext', 'produktbezeichnung', 'stoffbezeichnung'], part: ['produktname', 'handelsname', 'bezeichnung', 'stoffname'] },
    { key: 'maker', label: 'Hersteller', exact: ['hersteller', 'lieferant', 'anbieter', 'firma', 'herstellerlieferant'], part: ['hersteller', 'lieferant'] },
    { key: 'kat', label: 'Kataster-Nummer', exact: ['katasternr', 'katasternummer', 'katasterreferenz', 'katnr', 'kataster', 'gefahrstoffnummer', 'stoffnummer', 'artikelnummer', 'materialnummer', 'nummer', 'id', 'katasterid'], part: ['kataster', 'artikelnr', 'materialnr'] },
    { key: 'cas', label: 'CAS-Nummer', exact: ['cas', 'casnr', 'casnummer'], part: ['casnr', 'casnummer'] },
    { key: 'ghs', label: 'GHS-Piktogramme', exact: ['ghs', 'piktogramme', 'piktogramm', 'ghspiktogramme', 'gefahrenpiktogramme', 'gefahrensymbole', 'symbole', 'ghscodes'], part: ['piktogramm', 'ghs'] },
    { key: 'hSaetze', label: 'H-Sätze', exact: ['hsaetze', 'hsatz', 'gefahrenhinweise', 'hphrasen', 'h'], part: ['hsaetze', 'hsatz', 'gefahrenhinweis'] },
    { key: 'signal', label: 'Signalwort', exact: ['signalwort'], part: ['signalwort'] },
    { key: 'wgk', label: 'Wassergefährdungsklasse', exact: ['wgk', 'wassergefaehrdungsklasse', 'wgkklasse', 'wgkinformation'], part: ['wgk', 'wassergefaehrdung'] },
    { key: 'state', label: 'Aggregatzustand', exact: ['aggregatzustand', 'zustand', 'form'], part: ['aggregat'] },
    { key: 'sdbDate', label: 'SDB-Datum', exact: ['sdbdatum', 'sdbstand', 'sdbversion', 'datumsdb', 'sdbvom', 'stand', 'sdbaktuell'], part: ['sdbdatum', 'sdbstand', 'sdbvom'] },
    { key: 'place', label: 'Lagerort', exact: ['lagerort', 'standort', 'lager', 'verwendungsort', 'einsatzort'], part: ['lagerort', 'verwendungsort'] },
  ];

  function suggestMapping(headers) {
    const keys = headers.map(headKey);
    const mapping = {};
    const used = new Set();
    FIELDS.forEach(f => {
      let idx = keys.findIndex((k, i) => !used.has(i) && k && f.exact.includes(k));
      if (idx < 0) idx = keys.findIndex((k, i) => !used.has(i) && k.length >= 4 && f.part.some(p => k.includes(p)));
      if (idx >= 0) { mapping[f.key] = idx; used.add(idx); }
    });
    return mapping;
  }
  function findHeaderRow(rows) {
    let best = 0, bestScore = -1;
    for (let i = 0; i < Math.min(15, rows.length); i++) {
      const m = suggestMapping(rows[i].map(c => clean(c, 80)));
      const score = Object.keys(m).length + (m.name !== undefined ? 3 : 0);
      if (score > bestScore) { bestScore = score; best = i; }
    }
    return best;
  }

  // ---------- Normalisierung der Zeilen ----------
  function parseGhs(v) {
    const s = String(v || '');
    const out = [];
    const add = n => { const c = 'GHS0' + n; if (!out.includes(c)) out.push(c); };
    let m;
    const re = /GHS\s*[-_]?\s*0?([1-9])\b/gi;
    while ((m = re.exec(s))) add(m[1]);
    if (!out.length && /^\s*0?[1-9](\s*[,;\/ ]\s*0?[1-9])*\s*$/.test(s)) (s.match(/[1-9]/g) || []).forEach(add);
    return out.sort();
  }
  function parseWgk(v) {
    const s = fold(String(v || ''));
    if (/nwg|nicht wassergefaehrdend/.test(s)) return 'nwg';
    const m = /(?:wgk)?\s*([1-3])\b/.exec(s);
    return m ? 'WGK ' + m[1] : '';
  }
  function excelSerialToIso(n) {
    if (!(n > 20000 && n < 80000)) return '';
    const d = new Date(Date.UTC(1899, 11, 30) + Math.round(n) * 86400000);
    return d.toISOString().slice(0, 10);
  }
  function parseDate(v) {
    const s = clean(v, 40);
    if (/^\d{5}(\.\d+)?$/.test(s)) return excelSerialToIso(parseFloat(s)) || s;
    let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (m) return m[1] + '-' + m[2] + '-' + m[3];
    m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s);
    if (m) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
    return s;
  }

  function normName(s) { return fold(s).replace(/[^a-z0-9]+/g, ' ').trim(); }
  function stripParens(s) { return String(s).replace(/\([^)]*\)/g, ' '); }
  function normKat(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }

  /** Zeilen + Zuordnung -> Stoffliste (dedupliziert) */
  function toSubstances(rows, headerRow, mapping) {
    const out = [], seen = new Set();
    let skipped = 0;
    for (let i = headerRow + 1; i < rows.length; i++) {
      const r = rows[i] || [];
      const get = k => (mapping[k] === undefined || mapping[k] === '' || mapping[k] === null) ? '' : r[Number(mapping[k])];
      const name = clean(get('name'), 160);
      if (!name) { if (r.some(c => String(c || '').trim() !== '')) skipped++; continue; }
      const sub = {
        name, maker: clean(get('maker'), 120), kat: clean(get('kat'), 40), cas: clean(get('cas'), 30),
        ghs: parseGhs(get('ghs')), hSaetze: clean(get('hSaetze'), 200), signal: clean(get('signal'), 20),
        wgk: parseWgk(get('wgk')), state: clean(get('state'), 30), sdbDate: parseDate(get('sdbDate')), place: clean(get('place'), 80),
        source: 'kataster',
      };
      const dk = (normKat(sub.kat) || '') + '|' + normName(sub.name);
      if (seen.has(dk)) continue;
      seen.add(dk);
      out.push(sub);
    }
    return { substances: out, skipped };
  }

  /** Abgleich mit den Stammdaten. Ergebnis: { id, by } oder { id:'', conflict? } */
  function matchMaster(sub, master) {
    const kat = normKat(sub.kat);
    const byKat = kat ? master.filter(m => normKat(m.Kataster_Referenz) === kat) : [];
    const full = normName(sub.name), stripped = normName(stripParens(sub.name));
    const byName = master.filter(m => {
      const mf = normName(m.Produktname), ms = normName(stripParens(m.Produktname));
      if (mf === full) return true;
      const subHasParens = full !== stripped, mHasParens = mf !== ms;
      return (!subHasParens && mHasParens && ms === full) || (subHasParens && !mHasParens && mf === stripped);
    });
    if (byKat.length === 1 && byName.length === 0) return { id: byKat[0].Stoffreferenz_ID, by: 'Kataster-Nummer' };
    if (byKat.length === 1 && byName.length === 1) {
      return byKat[0].Stoffreferenz_ID === byName[0].Stoffreferenz_ID
        ? { id: byKat[0].Stoffreferenz_ID, by: 'Kataster-Nummer und Name' }
        : { id: '', conflict: 'Kataster-Nummer und Name passen zu verschiedenen Stammdaten-Stoffen' };
    }
    if (byKat.length === 0 && byName.length === 1) return { id: byName[0].Stoffreferenz_ID, by: 'Name' };
    if (byKat.length > 1 || byName.length > 1) return { id: '', conflict: 'Mehrere Treffer in den Stammdaten' };
    return { id: '' };
  }

  // ---------- Export neuer Stoffe fuer die Stammdaten ----------
  function csvCell(v) {
    let s = String(v === null || v === undefined ? '' : v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;          // Formel-Einschleusung verhindern
    return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function exportForMaster(subs, ghsNames) {
    const head = ['Produktname', 'Hersteller', 'Aggregatzustand', 'Kataster_Referenz', 'WGK_Information', 'Relevante_Eigenschaften', 'SDB_Datum', 'Bemerkung'];
    const lines = [head.join(';')];
    subs.forEach(s => {
      const props = s.ghs.map(c => (ghsNames && ghsNames[c]) || c).join(', ');
      lines.push([s.name, s.maker, s.state, s.kat, s.wgk, props, s.sdbDate, 'Aus Gefahrstoffkataster eingelesen, fachlich NICHT geprüft'].map(csvCell).join(';'));
    });
    return '﻿' + lines.join('\r\n') + '\r\n';
  }

  return { clean, decodeText, parseCSV, parseXLSX, readFile, FIELDS, suggestMapping, findHeaderRow, toSubstances, matchMaster, exportForMaster, parseGhs, parseWgk, parseDate, normName, normKat, csvCell };
}));
