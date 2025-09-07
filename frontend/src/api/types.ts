export interface UploadResponse {
  status: 'success' | 'error';
  message: string;
  data_info?: {
    shape: [number, number];
    columns: string[];
  };
  error?: string;
}

export interface ProcessingResponse {
  status: 'success' | 'error';
  message: string;
  pipeline_statistics?: any;
  final_data?: any;
  summary?: any;
  generated_files?: any;
  error?: string;
}
