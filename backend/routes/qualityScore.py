from flask import Blueprint, request, jsonify
import pandas as pd
import os
import json
from handlers import stored_data

qualityScore_bp = Blueprint('qualityScore', __name__)

def calculate_quality_score():
    """Calculate quality score based on misspelling corrections and deduplication."""
    try:
        # Get initial dataset row count
        initial_dataset = stored_data.get('initial_dataset')
        if initial_dataset is None:
            return None, "Initial dataset not found"
        
        initial_rows = len(initial_dataset)
        
        # Load corrections count from JSON file
        corrections_json_path = os.path.join('uploads', 'corrections_count.json')
        if not os.path.exists(corrections_json_path):
            return None, "Corrections count file not found. Please run misspelling correction first."
        
        with open(corrections_json_path, 'r', encoding='utf-8') as f:
            corrections_count = json.load(f)
        
        # Calculate total corrections
        total_corrections = sum(corrections_count.values())
        
        # Load duplicates file to get duplicates count
        duplicates_files = [f for f in os.listdir('outputs') if f.startswith('duplicates_removed_')]
        if not duplicates_files:
            return None, "Duplicates file not found"
        
        duplicates_path = os.path.join('outputs', duplicates_files[-1])  # Get latest
        duplicates_df = pd.read_csv(duplicates_path)
        duplicates_count = len(duplicates_df)
        
        # Calculate A: Misspelling ratio
        total_possible_corrections = initial_rows * len(corrections_count.keys())
        if total_possible_corrections > 0:
            A = (total_corrections / total_possible_corrections) * 100
        else:
            A = 0
        
        # Calculate B: Duplication ratio
        if initial_rows > 0:
            B = (duplicates_count / initial_rows) * 100
        else:
            B = 0
        
        # Calculate final quality score
        quality_score = 0.85 * (100 - A) + 0.15 * (100 - B)
        
        return {
            'quality_score': round(quality_score, 2),
            'misspelling_ratio': round(A, 2),
            'duplication_ratio': round(B, 2),
            'total_corrections': total_corrections,
            'duplicates_count': duplicates_count,
            'initial_rows': initial_rows
        }, None
        
    except Exception as e:
        return None, f"Error calculating quality score: {str(e)}"

@qualityScore_bp.route('/quality-score', methods=['GET'])
def get_quality_score():
    """Get the calculated quality score."""
    result, error = calculate_quality_score()
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'status': 'success',
        'quality_metrics': result
    })
