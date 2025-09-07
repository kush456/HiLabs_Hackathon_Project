import os
import pandas as pd
from datetime import datetime
from typing import Dict, Any

UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
ALLOWED_EXTENSIONS = {'csv'}

generated_files = []

def load_existing_files():
    files = []
    if os.path.exists(OUTPUT_FOLDER):
        for filename in os.listdir(OUTPUT_FOLDER):
            if filename.endswith('.csv'):
                filepath = os.path.join(OUTPUT_FOLDER, filename)
                if os.path.isfile(filepath):
                    try:
                        df = pd.read_csv(filepath)
                        timestamp = "unknown"
                        if "_" in filename:
                            parts = filename.split("_")
                            if len(parts) >= 2:
                                timestamp = parts[-1].replace('.csv', '')
                        step_description = "existing_file"
                        if "initial" in filename:
                            step_description = "Initial Dataset Upload"
                        elif "processed" in filename:
                            step_description = "Final Processing"
                        elif "merged" in filename:
                            step_description = "Data Merging"
                        file_info = {
                            'filename': filename,
                            'filepath': filepath,
                            'step': step_description,
                            'timestamp': timestamp,
                            'records': len(df),
                            'columns': len(df.columns),
                            'size_mb': round(os.path.getsize(filepath) / (1024 * 1024), 2)
                        }
                        files.append(file_info)
                    except Exception as e:
                        print(f"Warning: Could not process existing file {filename}: {e}")
    return files

def generate_csv_file(df, filename_prefix, step_description=""):
    if df is None or df.empty:
        return None
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{filename_prefix}_{timestamp}.csv"
    filepath = os.path.join(OUTPUT_FOLDER, filename)
    # Remove previous output files for the same state (prefix) before saving new output
    for f in os.listdir(OUTPUT_FOLDER):
        if f.startswith(filename_prefix) and f.endswith('.csv'):
            file_path_to_remove = os.path.join(OUTPUT_FOLDER, f)
            # Don't try to remove the file we're about to write
            if file_path_to_remove != filepath and os.path.isfile(file_path_to_remove):
                try:
                    os.remove(file_path_to_remove)
                except PermissionError:
                    print(f"Warning: Could not remove {file_path_to_remove} (file in use)")
    df.to_csv(filepath, index=False)
    file_info = {
        'filename': filename,
        'filepath': filepath,
        'step': step_description,
        'timestamp': timestamp,
        'records': len(df),
        'columns': len(df.columns),
        'size_mb': round(os.path.getsize(filepath) / (1024 * 1024), 2)
    }
    generated_files.append(file_info)
    return file_info

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def dataframe_to_dict(df):
    if df is None:
        return None
    df_clean = df.copy()
    df_clean = df_clean.where(pd.notnull(df_clean), None)
    return {
        'data': df_clean.to_dict('records'),
        'columns': df_clean.columns.tolist(),
        'shape': df_clean.shape,
        'summary': {
            'total_records': len(df_clean),
            'total_columns': len(df_clean.columns)
        }
    }
