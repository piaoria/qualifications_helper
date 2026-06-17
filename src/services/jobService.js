// 채용 공고 데이터 조회 / 상태 변경
import { supabase } from './supabaseClient.js';

// 공고 목록 (숨김 제외, 최근 수집순)
// WHY: 원티드 공고는 due_date가 전부 NULL(상시)이라 마감일 정렬이 무의미 → fetched_at 최신순.
export const getJobPostings = async () => {
  // 필요한 컬럼만 (raw JSONB 제외 — 용량 큼, 프런트 미사용)
  const { data, error } = await supabase
    .from('job_postings')
    .select('id,company_name,position,job_category,experience,location,url,due_date,fetched_at,is_bookmarked,is_hidden')
    .eq('is_hidden', false)
    .order('fetched_at', { ascending: false, nullsFirst: false });
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
