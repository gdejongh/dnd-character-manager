import { useState, useMemo, useEffect } from 'react';
import type { SrdSpell } from '../types/srdSpell';

let cachedSpells: SrdSpell[] | null = null;

export function useSpellDatabase() {
  const [spells, setSpells] = useState<SrdSpell[]>(cachedSpells ?? []);
  const [loading, setLoading] = useState(cachedSpells === null);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const [schoolFilter, setSchoolFilter] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [concentrationFilter, setConcentrationFilter] = useState<boolean | null>(null);
  const [ritualFilter, setRitualFilter] = useState<boolean | null>(null);

  useEffect(() => {
    if (cachedSpells) return;
    import('../data/srd-spells.json').then((mod) => {
      const data = (mod.default ?? mod) as SrdSpell[];
      cachedSpells = data;
      setSpells(data);
      setLoading(false);
    });
  }, []);

  const filteredSpells = useMemo(() => {
    const q = search.toLowerCase();
    return spells.filter((s) => {
      if (q && !s.name.toLowerCase().includes(q)) return false;
      if (levelFilter !== null && s.level !== levelFilter) return false;
      if (schoolFilter && s.school !== schoolFilter) return false;
      if (classFilter && !s.classes.some((c) => c.toLowerCase() === classFilter.toLowerCase())) return false;
      if (concentrationFilter !== null && s.concentration !== concentrationFilter) return false;
      if (ritualFilter !== null && s.ritual !== ritualFilter) return false;
      return true;
    });
  }, [spells, search, levelFilter, schoolFilter, classFilter, concentrationFilter, ritualFilter]);

  const schools = useMemo(
    () => [...new Set(spells.map((s) => s.school))].sort(),
    [spells],
  );

  const classes = useMemo(
    () => [...new Set(spells.flatMap((s) => s.classes))].sort(),
    [spells],
  );

  function clearFilters() {
    setSearch('');
    setLevelFilter(null);
    setSchoolFilter(null);
    setClassFilter(null);
    setConcentrationFilter(null);
    setRitualFilter(null);
  }

  return {
    spells: filteredSpells,
    allSpells: spells,
    loading,
    search,
    setSearch,
    levelFilter,
    setLevelFilter,
    schoolFilter,
    setSchoolFilter,
    classFilter,
    setClassFilter,
    concentrationFilter,
    setConcentrationFilter,
    ritualFilter,
    setRitualFilter,
    schools,
    classes,
    clearFilters,
  };
}
