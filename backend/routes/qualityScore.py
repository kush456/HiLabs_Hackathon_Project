import os
from flask import Blueprint, jsonify
import pandas as pd
from routes.deduplication import stored_data
from routes.misspelling import correction_count

def get_initial_row_count():
    # Try to get the initial uploaded file from stored_data
    df = stored_data.get('initial_dataset')
    if df is not None:
        return len(df)
    # Fallback: try to read from uploads folder
    upload_folder = 'uploads'
    for f in os.listdir(upload_folder):
        if f.endswith('.csv'):
            try:
                df = pd.read_csv(os.path.join(upload_folder, f))
                return len(df)
            except Exception:
                continue
    return 0

def get_duplicates_count():
    # Try to get duplicates from deduplication
    try:
        from routes.deduplication import duplicates
        if duplicates is not None:
            return len(duplicates)
    except Exception:
        pass
    return 0

def get_correction_count():
    # correction_count is a dict from misspelling.py
    if correction_count is not None:
        return len(correction_count.keys())
    return 0

quality_score_bp = Blueprint('quality_score', __name__)

@quality_score_bp.route('/quality-score', methods=['GET'])
def quality_score():
    initial_rows = get_initial_row_count()
    correction_keys = get_correction_count()
    total_misspellings = correction_keys
    # A: (total_misspellings / (initial_rows * correction_keys)) * 100
    if initial_rows > 0 and correction_keys > 0:
        a = (total_misspellings / (initial_rows * correction_keys)) * 100
    else:
        a = 0
    # B: (duplicates / initial_rows) * 100
    duplicates_count = get_duplicates_count()
    if initial_rows > 0:
        b = (duplicates_count / initial_rows) * 100
    else:
        b = 0
    # Final quality score
    quality_score = 0.85 * (100 - a) + 0.15 * (100 - b)
    return jsonify({
        'status': 'success',
        'quality_score': round(quality_score, 2),
        'A': round(a, 2),
        'B': round(b, 2)
    })
