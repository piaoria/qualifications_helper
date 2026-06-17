// 자격증 / 시험일정 데이터 조회
import { supabase } from './supabaseClient.js';

// 활성 자격증 종목 목록
export const getCertifications = async () => {
  const { data, error } = await supabase
    .from('certifications')
    .select('*')
    .eq('is_active', true)
    .order('id');
  if (error) throw error;
  return data;
};

// 시험 일정 (종목명 포함, 필기시험일 빠른 순)
export const getExamSchedules = async () => {
  const { data, error } = await supabase
    .from('exam_schedules')
    .select('*, certifications(name)')
    .order('written_exam_start', { ascending: true });
  if (error) throw error;
  return data;
};
