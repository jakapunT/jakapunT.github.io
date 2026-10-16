// Release dates: a lesson goes online a few days before its class.
//
//   release date = class date (course.yml schedule) − release_days_before (course.yml, default 3)
//   front matter `release: YYYY-MM-DD` overrides it; a lesson with neither counts as released.
//
// "Today" is the date in Bangkok. COURSE_TODAY=YYYY-MM-DD pretends it is another day (testing).

import { LectureError } from './parse.mjs';

export const DEFAULT_RELEASE_DAYS_BEFORE = 3;

// 'YYYY-MM-DD' from a YAML date (js-yaml gives a Date at UTC midnight) or a string; null if absent.
export function isoDate(d) {
  if (d == null || d === '') return null;
  if (d instanceof Date) return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
  const s = String(d).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(new Date(`${s}T00:00:00Z`).getTime())) return undefined;
  return s;
}

const addDays = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

export function todayBangkok() {
  if (process.env.COURSE_TODAY) {
    const t = isoDate(process.env.COURSE_TODAY);
    if (!t) throw new Error(`COURSE_TODAY must be YYYY-MM-DD, not "${process.env.COURSE_TODAY}"`);
    return t;
  }
  // en-CA formats as YYYY-MM-DD
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
}

export function releaseDaysBefore(course) {
  const n = course.release_days_before ?? DEFAULT_RELEASE_DAYS_BEFORE;
  if (!Number.isInteger(n) || n < 0) throw new Error(`course.yml: release_days_before must be a whole number of days (0 or more), not "${n}"`);
  return n;
}

// { date: 'YYYY-MM-DD' | null, released: boolean } for one lesson
export function releaseOf(course, lecture, today = todayBangkok()) {
  const own = lecture.meta.release;
  if (own != null) {
    const date = isoDate(own);
    if (!date) throw new LectureError(lecture.rel, 1, `release must be a date like 2026-10-27, not "${own}"`);
    return { date, released: date <= today };
  }
  const entry = (course.schedule ?? []).find((e) => Number(e.lesson) === Number(lecture.meta.lesson));
  const classDate = isoDate(entry?.date);
  if (classDate === undefined) throw new Error(`course.yml: lesson ${lecture.meta.lesson} has date "${entry.date}"; use YYYY-MM-DD`);
  if (!classDate) return { date: null, released: true };
  const date = addDays(classDate, -releaseDaysBefore(course));
  return { date, released: date <= today };
}
