// 자격증 일정 관련 순수 함수
import { daysUntil } from './date.js';

// 단계 순서 (시간순). 접수는 마감일 기준, 나머지는 해당일 기준.
const MILESTONES = [
  ['written_apply_end', '필기접수'],
  ['written_exam_start', '필기시험'],
  ['written_result_date', '필기발표'],
  ['practical_apply_end', '실기접수'],
  ['practical_exam_start', '실기시험'],
  ['final_result_date', '실기발표'],
];

// 오늘 이후 가장 가까운 다음 단계 → { date, label } (모두 지났으면 null)
export const nextMilestone = (exam) => {
  for (const [key, label] of MILESTONES) {
    const d = daysUntil(exam[key]);
    if (d !== null && d >= 0) return { date: exam[key], label };
  }
  return null;
};
