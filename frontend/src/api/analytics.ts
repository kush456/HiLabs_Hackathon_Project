import axios from 'axios';

const API_BASE = 'http://localhost:5000';

export const fetchProcessingResults = async () => {
  // Fetch complete pipeline stats
  const pipelineRes = await axios.post(`${API_BASE}/process/complete-pipeline`);
  if (pipelineRes.data.status !== 'success') throw new Error(pipelineRes.data.error || 'Failed to fetch pipeline results');
  const stats = pipelineRes.data.pipeline_stats;

  // Debug: log the backend response for pipeline_stats
  // eslint-disable-next-line no-console
  console.log('pipeline_stats from backend:', stats);

  // Use the new deduplication statistics structure
  const initialCount = stats.deduplication?.initial_rows || stats.initial?.total_count || 0;
  const finalCount = stats.deduplication?.final_rows || stats.final?.total_count || 0;
  const duplicatesRemoved = stats.deduplication?.duplicates_removed || (initialCount - finalCount);

  // Final combined rows after processing
  const afterDedup = (stats.final?.ca_count || 0) + (stats.final?.ny_count || 0);

  // Columns: use CA final shape if available
  const totalColumns = pipelineRes.data.final_data?.ca_data?.[0] ? Object.keys(pipelineRes.data.final_data.ca_data[0]).length : 0;

  // Map npi_validation or npiValidation if present
  const npiValidation = stats.npi_validation || stats.npiValidation || undefined;

  return {
    totalColumns,
    beforeCount: initialCount,
    afterCount: afterDedup,
    removed: duplicatesRemoved,
    dedupBefore: initialCount,
    dedupAfter: finalCount,
    dedupRemoved: duplicatesRemoved,
    statusDistribution: stats.status_distribution || { ca_status: {}, ny_status: {} },
    providerDistribution: stats.provider_distribution || { ca_providers: 0, ny_providers: 0, total_providers: 0 },
    pipelineSteps: stats.pipeline_steps || [],
    npiValidation
  };
};
