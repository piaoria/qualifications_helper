// 채용 공고 데이터 조회 / 상태 변경
import { supabase } from './supabaseClient.js';

// 공고 목록 (숨김 제외, 마감일 빠른 순)
export const getJobPostings = async () => {
  const { data, error } = await supabase
    .from('job_postings')
    .select('*')
    .eq('is_hidden', false)
    .order('due_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data;
};

// 북마크 토글
export const toggleBookmark = async (id, value) => {
  const { error } = await supabase
    .from('job_postings')
    .update({ is_bookmarked: value })
    .eq('id', id);
  if (error) throw error;
};

// 공고 숨기기
export const hideJob = async (id) => {
  const { error } = await supabase
    .from('job_postings')
    .update({ is_hidden: true })
    .eq('id', id);
  if (error) throw error;
};
