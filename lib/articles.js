import { LEVELS } from './util';

/** Turns a flat list of article rows into groups: one entry per article, with a version for each level. */
export function groupVersions(rows) {
  const groups = new Map();
  for (const r of rows) {
    const key = r.group_id ?? r.id;
    if (!groups.has(key)) groups.set(key, { group_id: key, versions: [] });
    groups.get(key).versions.push(r);
  }
  for (const g of groups.values()) g.versions.sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level));
  return [...groups.values()];
}

/** The version of a group closest to the wanted level (ties go to the easier one). */
export function pickVersion(group, level) {
  const want = LEVELS.indexOf(level);
  return [...group.versions].sort((a, b) => {
    const da = Math.abs(LEVELS.indexOf(a.level) - want);
    const db = Math.abs(LEVELS.indexOf(b.level) - want);
    return da - db || LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level);
  })[0];
}
