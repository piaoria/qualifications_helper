// 문제 은행 조회 — 검수 완료(reviewed=true) 문제만 노출
import { supabase } from './supabaseClient.js';

// 검수 완료 문제가 있는 종목·유형 요약 (이름, 필기/실기 보유 수)
export const getQuizSummary = async () => {
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('certification_id,exam_type,certifications(name)')
    .eq('reviewed', true);
  if (error) throw error;

  const map = new Map();
  for (const q of data) {
    const id = q.certification_id;
    if (!map.has(id)) {
      map.set(id, { id, name: q.certifications?.name ?? '자격증', written: 0, practical: 0 });
    }
    const e = map.get(id);
    if (q.exam_type === 'written') e.written += 1;
    else if (q.exam_type === 'practical') e.practical += 1;
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
};

// 특정 종목·유형 문제 (랜덤 셔플, 최대 limit개)
export const getQuizQuestions = async (certId, examType, limit = 10) => {
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('id,category,question,choices,answer_index,explanation')
    .eq('reviewed', true)
    .eq('certification_id', certId)
    .eq('exam_type', examType);
  if (error) throw error;
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
};
