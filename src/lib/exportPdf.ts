import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  Character, AbilityScore, SpellSlot, Spell,
  InventoryItem, Feature, CharacterNotes, Ability,
} from '../types/database';
import {
  ABILITIES,
  ABILITY_NAMES,
  SKILLS,
  getModifier,
  getProficiencyBonus,
  formatModifier,
  getSpellSaveDC,
  getSpellAttackBonus,
} from '../constants/dnd';
import { showToast } from './toast';

export type PdfStyle = 'color' | 'bw';

interface ExportData {
  character: Character;
  scores: AbilityScore[];
  slots: SpellSlot[];
  spells: Spell[];
  items: InventoryItem[];
  features: Feature[];
  notes: CharacterNotes | null;
}

/* ── Themes ──────────────────────────────────────────────────────────────── */

type RGB = [number, number, number];

interface Theme {
  bg: RGB; surface: RGB; surfaceAlt: RGB;
  gold: RGB; text: RGB; textMuted: RGB;
  crimson: RGB; indigo: RGB; green: RGB; border: RGB;
  headerBg: RGB;
}

const COLOR_THEME: Theme = {
  bg:         [15, 14, 19],
  surface:    [28, 27, 37],
  surfaceAlt: [35, 33, 46],
  gold:       [201, 168, 76],
  text:       [232, 224, 240],
  textMuted:  [150, 142, 163],
  crimson:    [220, 38, 38],
  indigo:     [120, 120, 255],
  green:      [74, 222, 128],
  border:     [55, 52, 68],
  headerBg:   [22, 20, 30],
};

const BW_THEME: Theme = {
  bg:         [255, 255, 255],
  surface:    [248, 248, 248],
  surfaceAlt: [240, 240, 240],
  gold:       [30, 30, 30],
  text:       [30, 30, 30],
  textMuted:  [100, 100, 100],
  crimson:    [60, 60, 60],
  indigo:     [60, 60, 60],
  green:      [50, 50, 50],
  border:     [170, 170, 170],
  headerBg:   [235, 235, 235],
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function getScore(scores: AbilityScore[], ability: string): number {
  return scores.find((s) => s.ability === ability)?.score ?? 10;
}

function getSaveProf(scores: AbilityScore[], ability: string): boolean {
  return scores.find((s) => s.ability === ability)?.saving_throw_proficiency ?? false;
}

const ORD: Record<number, string> = {
  0: 'Cantrips', 1: '1st', 2: '2nd', 3: '3rd', 4: '4th',
  5: '5th', 6: '6th', 7: '7th', 8: '8th', 9: '9th',
};

/* ── Page Context ────────────────────────────────────────────────────────── */

interface PageCtx {
  doc: jsPDF;
  t: Theme;
  style: PdfStyle;
  margin: number;
  pageW: number;
  pageH: number;
  contentW: number;
  y: number;
}

function paintBg(ctx: PageCtx) {
  const { doc, t, style, pageW, pageH } = ctx;
  doc.setFillColor(...t.bg);
  doc.rect(0, 0, pageW, pageH, 'F');
  if (style === 'color') {
    doc.setDrawColor(...t.border);
    doc.setLineWidth(0.5);
    doc.rect(24, 24, pageW - 48, pageH - 48);
  }
}

function needPage(ctx: PageCtx, needed: number): PageCtx {
  if (ctx.y + needed > ctx.pageH - ctx.margin) {
    ctx.doc.addPage();
    ctx.y = ctx.margin;
    paintBg(ctx);
  }
  return ctx;
}

/* ── Section heading helper ──────────────────────────────────────────────── */

function sectionHeading(ctx: PageCtx, title: string, minSpace = 50): PageCtx {
  needPage(ctx, minSpace);
  const { doc, t, margin, contentW } = ctx;

  // Heading underline
  doc.setDrawColor(...t.gold);
  doc.setLineWidth(style(ctx) === 'color' ? 1 : 0.75);
  doc.line(margin, ctx.y + 14, margin + contentW, ctx.y + 14);

  // Heading text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...t.gold);
  doc.text(title, margin, ctx.y + 10);

  ctx.y += 22;
  return ctx;
}

function style(ctx: PageCtx): PdfStyle { return ctx.style; }

/* ══════════════════════════════════════════════════════════════════════════ */
/*  PUBLIC API                                                               */
/* ══════════════════════════════════════════════════════════════════════════ */

export function exportCharacterPdf(data: ExportData, pdfStyle: PdfStyle) {
  const t = pdfStyle === 'color' ? COLOR_THEME : BW_THEME;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;

  const ctx: PageCtx = {
    doc, t, style: pdfStyle, margin, pageW, pageH,
    contentW: pageW - margin * 2,
    y: margin,
  };

  paintBg(ctx);

  drawHeader(ctx, data.character);
  drawAbilityScores(ctx, data);
  drawSavingThrows(ctx, data);
  drawSkills(ctx, data);
  drawHp(ctx, data.character);

  if (data.spells.length > 0 || data.slots.some((s) => s.total > 0)) {
    drawSpells(ctx, data);
  }
  if (data.items.length > 0) {
    drawInventory(ctx, data);
  }
  if (data.features.length > 0) {
    drawFeatures(ctx, data);
  }
  if (data.notes?.content) {
    drawNotes(ctx, data.notes);
  }

  // Page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...t.textMuted);
    doc.text(
      `${data.character.name}  -  Page ${i} of ${totalPages}`,
      pageW / 2, pageH - 18,
      { align: 'center' },
    );
  }

  const safeName = data.character.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`${safeName}_Character_Sheet.pdf`);
  showToast('PDF exported ✓');
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  DRAWING FUNCTIONS                                                        */
/* ══════════════════════════════════════════════════════════════════════════ */

function drawHeader(ctx: PageCtx, char: Character) {
  const { doc, t, margin, contentW } = ctx;
  const isColor = style(ctx) === 'color';

  // Header background band
  if (isColor) {
    doc.setFillColor(...t.headerBg);
    doc.roundedRect(margin, ctx.y, contentW, 55, 4, 4, 'F');
    doc.setDrawColor(...t.gold);
    doc.setLineWidth(0.75);
    doc.roundedRect(margin, ctx.y, contentW, 55, 4, 4, 'S');
  } else {
    doc.setFillColor(...t.surface);
    doc.rect(margin, ctx.y, contentW, 55, 'F');
    doc.setDrawColor(...t.border);
    doc.setLineWidth(0.5);
    doc.rect(margin, ctx.y, contentW, 55, 'S');
  }

  const innerX = margin + 12;

  // Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...t.gold);
  doc.text(char.name, innerX, ctx.y + 22);

  // Subtitle
  const parts = [char.race, char.class, `Level ${char.level}`].filter(Boolean);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...t.textMuted);
  doc.text(parts.join('  ·  '), innerX, ctx.y + 38);

  // Proficiency bonus on right
  const profBonus = getProficiencyBonus(char.level);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...t.text);
  doc.text(
    `Prof. Bonus: ${formatModifier(profBonus)}`,
    margin + contentW - 12, ctx.y + 22,
    { align: 'right' },
  );

  // HP summary on right
  const hpRatio = char.current_hp / Math.max(1, char.max_hp);
  doc.setTextColor(...(hpRatio > 0.5 ? t.green : t.crimson));
  doc.setFontSize(9);
  doc.text(
    `HP: ${char.current_hp} / ${char.max_hp}${char.temp_hp > 0 ? `  (+${char.temp_hp} temp)` : ''}`,
    margin + contentW - 12, ctx.y + 38,
    { align: 'right' },
  );

  ctx.y += 68;
}

/* ── Ability Scores ──────────────────────────────────────────────────────── */

function drawAbilityScores(ctx: PageCtx, data: ExportData) {
  sectionHeading(ctx, 'ABILITY SCORES', 90);
  const { doc, t, margin, contentW } = ctx;
  const isColor = style(ctx) === 'color';

  const gap = 6;
  const boxW = (contentW - gap * 5) / 6;
  const boxH = 56;

  ABILITIES.forEach((ability, i) => {
    const x = margin + i * (boxW + gap);
    const score = getScore(data.scores, ability);
    const mod = getModifier(score);

    // Box
    if (isColor) {
      doc.setFillColor(...t.surface);
      doc.roundedRect(x, ctx.y, boxW, boxH, 3, 3, 'F');
      doc.setDrawColor(...t.border);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, ctx.y, boxW, boxH, 3, 3, 'S');
    } else {
      doc.setDrawColor(...t.border);
      doc.setLineWidth(0.75);
      doc.roundedRect(x, ctx.y, boxW, boxH, 3, 3, 'S');
    }

    // Ability label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...t.gold);
    doc.text(ability, x + boxW / 2, ctx.y + 11, { align: 'center' });

    // Modifier (big)
    doc.setFontSize(18);
    doc.setTextColor(...t.text);
    doc.text(formatModifier(mod), x + boxW / 2, ctx.y + 32, { align: 'center' });

    // Score (small)
    doc.setFontSize(8);
    doc.setTextColor(...t.textMuted);
    doc.text(String(score), x + boxW / 2, ctx.y + 46, { align: 'center' });
  });

  ctx.y += boxH + 12;
}

/* ── Saving Throws ───────────────────────────────────────────────────────── */

function drawSavingThrows(ctx: PageCtx, data: ExportData) {
  sectionHeading(ctx, 'SAVING THROWS', 60);
  const { doc, t, margin, contentW } = ctx;
  const profBonus = getProficiencyBonus(data.character.level);

  const colW = contentW / 3;
  const rowH = 15;

  ABILITIES.forEach((ability, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = margin + col * colW;
    const rowY = ctx.y + row * rowH;

    const score = getScore(data.scores, ability);
    const mod = getModifier(score);
    const prof = getSaveProf(data.scores, ability);
    const total = mod + (prof ? profBonus : 0);

    // Proficiency indicator
    doc.setFillColor(...(prof ? t.gold : t.border));
    doc.circle(x + 5, rowY + 5, 2.5, 'F');

    // Name
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...t.text);
    doc.text(ABILITY_NAMES[ability], x + 14, rowY + 8);

    // Modifier
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...(prof ? t.gold : t.textMuted));
    doc.text(formatModifier(total), x + colW - 8, rowY + 8, { align: 'right' });
  });

  ctx.y += Math.ceil(ABILITIES.length / 3) * rowH + 10;
}

/* ── Skills ──────────────────────────────────────────────────────────────── */

function drawSkills(ctx: PageCtx, data: ExportData) {
  sectionHeading(ctx, 'SKILLS', 60);
  const { doc, t, margin } = ctx;
  const isColor = style(ctx) === 'color';
  const profBonus = getProficiencyBonus(data.character.level);

  const profData = SKILLS.map((skill) => {
    const score = getScore(data.scores, skill.ability);
    const mod = getModifier(score);
    const prof = (data.character.skill_proficiencies ?? []).includes(skill.name);
    const total = mod + (prof ? profBonus : 0);
    return { prof, name: skill.name, ability: skill.ability, mod: formatModifier(total) };
  });
  const tableBody = profData.map((d) => ['', d.name, d.ability, d.mod]);

  autoTable(doc, {
    startY: ctx.y,
    margin: { left: margin, right: margin },
    head: [['', 'Skill', 'Ability', 'Mod']],
    body: tableBody,
    theme: isColor ? 'grid' : 'plain',
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      textColor: t.text,
      lineColor: t.border,
      lineWidth: 0.25,
    },
    headStyles: {
      fillColor: isColor ? t.surface : t.surfaceAlt,
      textColor: t.gold,
      fontStyle: 'bold',
      fontSize: 7,
    },
    bodyStyles: { fillColor: t.bg },
    alternateRowStyles: { fillColor: isColor ? t.surfaceAlt : t.surface },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },
      2: { halign: 'center', cellWidth: 36 },
      3: { halign: 'center', cellWidth: 32, fontStyle: 'bold' },
    },
    didParseCell: (hook) => {
      if (hook.section !== 'body') return;
      const row = hook.row.index;
      const isProficient = profData[row].prof;
      if (hook.column.index === 3 && isProficient) {
        hook.cell.styles.textColor = t.gold;
      }
    },
    didDrawCell: (hook) => {
      if (hook.section !== 'body' || hook.column.index !== 0) return;
      const row = hook.row.index;
      const isProficient = profData[row].prof;
      const cx = hook.cell.x + hook.cell.width / 2;
      const cy = hook.cell.y + hook.cell.height / 2;
      if (isProficient) {
        doc.setFillColor(...t.gold);
        doc.circle(cx, cy, 3, 'F');
      } else {
        doc.setDrawColor(...t.border);
        doc.setLineWidth(0.5);
        doc.circle(cx, cy, 3, 'S');
      }
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx.y = ((doc as any).lastAutoTable?.finalY ?? ctx.y + 200) + 10;
}

/* ── HP ──────────────────────────────────────────────────────────────────── */

function drawHp(ctx: PageCtx, char: Character) {
  sectionHeading(ctx, 'HIT POINTS', 55);
  const { doc, t, margin, contentW } = ctx;
  const isColor = style(ctx) === 'color';

  const boxH = isColor ? 36 : 52;

  // Background box
  if (isColor) {
    doc.setFillColor(...t.surface);
    doc.roundedRect(margin, ctx.y, contentW, boxH, 3, 3, 'F');
    doc.setDrawColor(...t.border);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, ctx.y, contentW, boxH, 3, 3, 'S');
  } else {
    doc.setDrawColor(...t.border);
    doc.setLineWidth(0.75);
    doc.rect(margin, ctx.y, contentW, boxH, 'S');
  }

  const innerX = margin + 10;
  const midY = ctx.y + boxH / 2;

  if (isColor) {
    // Current / Max HP
    const hpRatio = char.current_hp / Math.max(1, char.max_hp);
    const hpColor = hpRatio > 0.5 ? t.green : t.crimson;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...hpColor);
    doc.text(String(char.current_hp), innerX, midY + 6);

    const curW = doc.getTextWidth(String(char.current_hp));
    doc.setFontSize(12);
    doc.setTextColor(...t.textMuted);
    doc.text(` / ${char.max_hp}`, innerX + curW, midY + 6);

    // Labels
    doc.setFontSize(7);
    doc.setTextColor(...t.textMuted);
    doc.text('Current HP', innerX, midY - 8);

    // Temp HP on right
    if (char.temp_hp > 0) {
      doc.setFontSize(10);
      doc.setTextColor(...t.indigo);
      doc.text(
        `Temp HP: ${char.temp_hp}`,
        margin + contentW - 10, midY + 4,
        { align: 'right' },
      );
    }
  } else {
    // Print-friendly: leave encounter-tracked HP fields blank for pencil updates
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...t.text);
    doc.text(`Max HP: ${char.max_hp}`, innerX, ctx.y + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...t.textMuted);
    doc.text('Current HP:', innerX, ctx.y + 34);
    doc.text('Temp HP:', innerX + 182, ctx.y + 34);

    doc.setDrawColor(...t.border);
    doc.setLineWidth(0.75);
    doc.line(innerX + 56, ctx.y + 31, innerX + 170, ctx.y + 31);
    doc.line(innerX + 230, ctx.y + 31, margin + contentW - 12, ctx.y + 31);
  }

  ctx.y += boxH + 12;
}

/* ── Spells ──────────────────────────────────────────────────────────────── */

function drawSpells(ctx: PageCtx, data: ExportData) {
  sectionHeading(ctx, 'SPELLS', 60);
  const { doc, t, margin, contentW } = ctx;
  const isColor = style(ctx) === 'color';
  const isPrintFriendly = style(ctx) === 'bw';

  const abilityScoreMap = Object.fromEntries(
    ABILITIES.map((ability) => [ability, getScore(data.scores, ability)]),
  ) as Record<Ability, number>;
  const spellSaveDc = getSpellSaveDC(data.character.class, data.character.level, abilityScoreMap);
  const spellAttackBonus = getSpellAttackBonus(
    data.character.class,
    data.character.level,
    abilityScoreMap,
  );

  if (isPrintFriendly) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...t.textMuted);
    doc.text('Spell Save DC:', margin, ctx.y);
    doc.text('Spell Attack Modifier:', margin + contentW / 2, ctx.y);
    doc.setDrawColor(...t.border);
    doc.setLineWidth(0.75);
    doc.line(margin + 66, ctx.y - 2, margin + contentW / 2 - 10, ctx.y - 2);
    doc.line(margin + contentW / 2 + 98, ctx.y - 2, margin + contentW - 6, ctx.y - 2);
    ctx.y += 12;
  } else if (spellSaveDc !== null || spellAttackBonus !== null) {
    const saveDcLabel = `Spell Save DC: ${spellSaveDc ?? '-'}`;
    const attackLabel = `Spell Attack: ${spellAttackBonus !== null ? formatModifier(spellAttackBonus) : '-'}`;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...t.indigo);
    doc.text(`${saveDcLabel}    ${attackLabel}`, margin, ctx.y);
    ctx.y += 12;
  }

  // Slot summary / tracker
  const activeSlots = data.slots
    .filter((s) => s.total > 0)
    .sort((a, b) => a.level - b.level);
  if (activeSlots.length > 0) {
    if (isPrintFriendly) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...t.text);
      doc.text('Spell Slots (mark used):', margin, ctx.y);
      ctx.y += 10;

      for (const slot of activeSlots) {
        needPage(ctx, 16);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...t.text);
        doc.text(`${ORD[slot.level]}:`, margin + 2, ctx.y + 7);

        const bubbleStartX = margin + 52;
        const bubbleGap = 11;
        for (let i = 0; i < slot.total; i++) {
          const cx = bubbleStartX + i * bubbleGap;
          doc.setDrawColor(...t.border);
          doc.setLineWidth(0.75);
          doc.circle(cx, ctx.y + 4, 3, 'S');
        }

        ctx.y += 14;
      }
      ctx.y += 4;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const parts = activeSlots.map(
        (s) => `${ORD[s.level]}: ${s.total - s.used}/${s.total}`,
      );
      doc.setTextColor(...t.indigo);
      doc.text(`Spell Slots: ${parts.join('    ')}`, margin, ctx.y);
      ctx.y += 14;
    }
  }

  // Spells grouped by level
  const byLevel = new Map<number, Spell[]>();
  for (const spell of data.spells) {
    const list = byLevel.get(spell.level) ?? [];
    list.push(spell);
    byLevel.set(spell.level, list);
  }

  for (const level of [...byLevel.keys()].sort((a, b) => a - b)) {
    const spells = byLevel.get(level)!;
    needPage(ctx, 40);

    // Level subheading
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...t.indigo);
    doc.text(level === 0 ? 'Cantrips' : `${ORD[level]} Level`, margin, ctx.y + 8);
    ctx.y += 14;

    const spellData = spells.map((s) => ({
      prepared: s.prepared,
      name: s.name,
      desc: s.description.trim() || '-',
    }));
    const body = spellData.map((s) => ['', s.name, s.desc]);

    autoTable(doc, {
      startY: ctx.y,
      margin: { left: margin, right: margin },
      head: [[level === 0 ? '' : 'Prep', 'Spell Name', 'Description']],
      body,
      theme: isColor ? 'grid' : 'plain',
      styles: {
        fontSize: 7,
        cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
        textColor: t.text,
        lineColor: t.border,
        lineWidth: 0.2,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: isColor ? t.surface : t.surfaceAlt,
        textColor: t.indigo,
        fontStyle: 'bold',
        fontSize: 7,
      },
      bodyStyles: { fillColor: t.bg },
      alternateRowStyles: { fillColor: isColor ? t.surfaceAlt : t.surface },
      columnStyles: {
        0: { halign: 'center', cellWidth: level === 0 ? 0.01 : 24 },
        1: { cellWidth: 80, fontStyle: 'bold' },
      },
      didDrawCell: (hook) => {
        if (hook.section !== 'body' || hook.column.index !== 0 || level === 0) return;
        const row = hook.row.index;
        const cx = hook.cell.x + hook.cell.width / 2;
        const cy = hook.cell.y + hook.cell.height / 2;
        const r = 3;

        if (isPrintFriendly) {
          doc.setDrawColor(...t.border);
          doc.setLineWidth(0.5);
          doc.circle(cx, cy, r, 'S');
          return;
        }

        const isPrepared = spellData[row].prepared;
        if (isPrepared) {
          doc.setFillColor(...t.indigo);
          // Draw a diamond shape
          doc.triangle(cx, cy - r, cx + r, cy, cx, cy + r, 'F');
          doc.triangle(cx, cy - r, cx - r, cy, cx, cy + r, 'F');
        } else {
          doc.setDrawColor(...t.border);
          doc.setLineWidth(0.5);
          doc.circle(cx, cy, r, 'S');
        }
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ctx.y = ((doc as any).lastAutoTable?.finalY ?? ctx.y + 40) + 8;
  }

  // Prepared summary
  const preparedCount = data.spells.filter((s) => s.prepared && s.level > 0).length;
  if (isColor && preparedCount > 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...t.textMuted);
    doc.text(`${preparedCount} spell(s) prepared`, margin + contentW, ctx.y, { align: 'right' });
    ctx.y += 10;
  }
}

/* ── Inventory ───────────────────────────────────────────────────────────── */

function drawInventory(ctx: PageCtx, data: ExportData) {
  sectionHeading(ctx, 'INVENTORY', 60);
  const { doc, t, margin, contentW } = ctx;
  const isColor = style(ctx) === 'color';

  // Weight summary
  const strScore = getScore(data.scores, 'STR');
  const capacity = strScore * 15;
  const totalWeight = data.items.reduce((sum, i) => sum + i.weight * i.quantity, 0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(
    ...(totalWeight > capacity ? t.crimson : t.textMuted),
  );
  doc.text(
    `Weight: ${totalWeight.toFixed(1)} lb  /  Capacity: ${capacity} lb`,
    margin + contentW, ctx.y - 12,
    { align: 'right' },
  );

  const body = data.items.map((item) => [
    item.name,
    String(item.quantity),
    `${(item.weight * item.quantity).toFixed(1)}`,
    item.notes || '-',
  ]);

  autoTable(doc, {
    startY: ctx.y,
    margin: { left: margin, right: margin },
    head: [['Item', 'Qty', 'Weight (lb)', 'Notes']],
    body,
    theme: isColor ? 'grid' : 'plain',
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      textColor: t.text,
      lineColor: t.border,
      lineWidth: 0.25,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: isColor ? t.surface : t.surfaceAlt,
      textColor: t.gold,
      fontStyle: 'bold',
      fontSize: 7,
    },
    bodyStyles: { fillColor: t.bg },
    alternateRowStyles: { fillColor: isColor ? t.surfaceAlt : t.surface },
    columnStyles: {
      1: { halign: 'center', cellWidth: 28 },
      2: { halign: 'right', cellWidth: 50 },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx.y = ((doc as any).lastAutoTable?.finalY ?? ctx.y + 40) + 12;
}

/* ── Features & Traits ───────────────────────────────────────────────────── */

function drawFeatures(ctx: PageCtx, data: ExportData) {
  sectionHeading(ctx, 'FEATURES & TRAITS', 50);
  const { doc, t, margin, contentW } = ctx;
  const isColor = style(ctx) === 'color';

  for (const feature of data.features) {
    // Calculate needed height
    doc.setFontSize(8);
    const descLines = feature.description
      ? doc.splitTextToSize(feature.description, contentW - 16) as string[]
      : [];
    const titleH = 14;
    const descH = descLines.length * 10;
    const blockH = titleH + descH + 10;

    needPage(ctx, blockH + 4);

    // Box
    if (isColor) {
      doc.setFillColor(...t.surface);
      doc.roundedRect(margin, ctx.y, contentW, blockH, 2, 2, 'F');
      doc.setDrawColor(...t.border);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, ctx.y, contentW, blockH, 2, 2, 'S');
    } else {
      doc.setDrawColor(...t.border);
      doc.setLineWidth(0.5);
      doc.rect(margin, ctx.y, contentW, blockH, 'S');
    }

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...t.text);
    doc.text(feature.title, margin + 8, ctx.y + 11);

    // Source tag
    if (feature.source) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(...t.gold);
      doc.text(feature.source, margin + contentW - 8, ctx.y + 11, { align: 'right' });
    }

    // Description
    if (descLines.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...t.textMuted);
      let ly = ctx.y + 22;
      for (const line of descLines) {
        doc.text(line, margin + 8, ly);
        ly += 10;
      }
    }

    ctx.y += blockH + 4;
  }
}

/* ── Notes ───────────────────────────────────────────────────────────────── */

function drawNotes(ctx: PageCtx, notes: CharacterNotes) {
  sectionHeading(ctx, 'NOTES', 40);
  const { doc, t, margin, contentW } = ctx;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...t.text);

  const lines = doc.splitTextToSize(notes.content, contentW - 8) as string[];
  const lineH = 11;

  for (const line of lines) {
    needPage(ctx, lineH + 2);
    doc.text(line, margin + 4, ctx.y);
    ctx.y += lineH;
  }

  ctx.y += 6;
}
