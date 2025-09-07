

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import pandas as pd
from utils import load_existing_files, generate_csv_file, allowed_file, dataframe_to_dict, generated_files
from handlers import (
    upload_initial_dataset_handler,
    stored_data
)
from routes.deduplication import deduplication_bp
from routes.standardization import standardization_bp
from routes.misspelling import misspelling_bp
from routes.qualityScore import qualityScore_bp

app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['OUTPUT_FOLDER'] = 'outputs'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

# Register blueprints
app.register_blueprint(standardization_bp)
app.register_blueprint(misspelling_bp)
app.register_blueprint(deduplication_bp)
app.register_blueprint(qualityScore_bp)


@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'success',
        'message': 'Provider Credentialing Analytics API is running',
        'version': '1.0.0'
    })

@app.route('/upload/initial-dataset', methods=['POST'])
def upload_initial_dataset():
    return upload_initial_dataset_handler()



@app.route('/process/split-by-state', methods=['POST'])
def split_by_state():
    """Split initial dataset by state (NY and CA)"""
    try:
        if stored_data['initial_dataset'] is None:
            return jsonify({'error': 'No initial dataset found. Please upload first.'}), 400
        
        initial_dataset = stored_data['initial_dataset']
        
        # Split data by state
        init_data_ca = initial_dataset[initial_dataset["license_state"] == "CA"].copy()
        init_data_ny = initial_dataset[initial_dataset["license_state"] == "NY"].copy()
        
        # Generate CSV files
        ca_file = generate_csv_file(init_data_ca, "ca_split", "State Split - CA Data")
        ny_file = generate_csv_file(init_data_ny, "ny_split", "State Split - NY Data")
        
        return jsonify({
            'status': 'success',
            'message': 'Data split by state successfully',
            'ca_data': dataframe_to_dict(init_data_ca),
            'ny_data': dataframe_to_dict(init_data_ny),
            'generated_files': {
                'ca_file': ca_file,
                'ny_file': ny_file
            },
            'summary': {
                'ca_records': len(init_data_ca),
                'ny_records': len(init_data_ny),
                'total_records': len(initial_dataset)
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Error splitting data by state: {str(e)}'}), 500

@app.route('/process/merge-datasets', methods=['POST'])
def merge_datasets():
    """Merge initial dataset with license databases"""
    try:
        initial_dataset = stored_data['initial_dataset']
        ny_data = stored_data['ny_data']
        ca_data = stored_data['ca_data']
        
        if any(data is None for data in [initial_dataset, ny_data, ca_data]):
            return jsonify({'error': 'Missing required datasets. Please upload all files first.'}), 400
        
        # Split data by state
        init_data_ca = initial_dataset[initial_dataset["license_state"] == "CA"].copy()
        init_data_ny = initial_dataset[initial_dataset["license_state"] == "NY"].copy()
        
        # Perform left joins based on license numbers
        merged_ca = pd.merge(init_data_ca, ca_data, how="left", on="license_number")
        merged_ny = pd.merge(init_data_ny, ny_data, how="left", on="license_number")
        
        # Store merged data
        stored_data['merged_ca'] = merged_ca
        stored_data['merged_ny'] = merged_ny
        
        # Generate CSV files
        ca_merged_file = generate_csv_file(merged_ca, "ca_merged", "Dataset Merge - CA Merged Data")
        ny_merged_file = generate_csv_file(merged_ny, "ny_merged", "Dataset Merge - NY Merged Data")
        
        return jsonify({
            'status': 'success',
            'message': 'Datasets merged successfully',
            'merged_data': {
                'ca_merged': dataframe_to_dict(merged_ca),
                'ny_merged': dataframe_to_dict(merged_ny)
            },
            'generated_files': {
                'ca_merged_file': ca_merged_file,
                'ny_merged_file': ny_merged_file
            },
            'merge_summary': {
                'ca_shape': merged_ca.shape,
                'ny_shape': merged_ny.shape,
                'ca_records_before': len(init_data_ca),
                'ny_records_before': len(init_data_ny),
                'ca_records_after': len(merged_ca),
                'ny_records_after': len(merged_ny)
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Error merging datasets: {str(e)}'}), 500


@app.route('/data/status', methods=['GET'])
def get_data_status():
    """Get status of all uploaded and processed data"""
    try:
        status = {}
        for key, value in stored_data.items():
            if value is not None:
                status[key] = {
                    'loaded': True,
                    'shape': value.shape,
                    'columns': value.columns.tolist()
                }
            else:
                status[key] = {'loaded': False}
        
        return jsonify({
            'status': 'success',
            'data_status': status
        })
        
    except Exception as e:
        return jsonify({'error': f'Error getting data status: {str(e)}'}), 500

@app.route('/data/export/<dataset_name>', methods=['GET'])
def export_dataset(dataset_name):
    """Export processed dataset as JSON"""
    try:
        if dataset_name not in stored_data:
            return jsonify({'error': 'Dataset not found'}), 404
        
        dataset = stored_data[dataset_name]
        if dataset is None:
            return jsonify({'error': 'Dataset not loaded'}), 404
        
        return jsonify({
            'status': 'success',
            'dataset_name': dataset_name,
            'data': dataframe_to_dict(dataset)
        })
        
    except Exception as e:
        return jsonify({'error': f'Error exporting dataset: {str(e)}'}), 500

@app.route('/files/list', methods=['GET'])
def list_generated_files():
    """List all generated CSV files"""
    try:
        files = load_existing_files()  # Always get the latest from disk
        return jsonify({
            'status': 'success',
            'generated_files': files,
            'total_files': len(files)
        })
    except Exception as e:
        return jsonify({'error': f'Error listing files: {str(e)}'}), 500

@app.route('/files/download/<filename>', methods=['GET'])
def download_file(filename):
    """Download a generated CSV file"""
    try:
        # Always check the disk for the file, not just the generated_files list
        filepath = os.path.join(app.config['OUTPUT_FOLDER'], filename)
        
        # If exact file doesn't exist, try to find a similar file with the same prefix
        if not os.path.exists(filepath) and os.path.exists(app.config['OUTPUT_FOLDER']):
            # Extract the prefix (everything before the timestamp)
            parts = filename.split('_')
            if len(parts) >= 2:
                # Find prefix by removing the timestamp part
                prefix = '_'.join(parts[:-1])  # e.g., "ca_final_processed"
                
                # Look for any file with this prefix
                for existing_file in os.listdir(app.config['OUTPUT_FOLDER']):
                    if existing_file.startswith(prefix) and existing_file.endswith('.csv'):
                        print(f"Found similar file: {existing_file} for requested: {filename}")
                        filepath = os.path.join(app.config['OUTPUT_FOLDER'], existing_file)
                        filename = existing_file  # Update filename for download
                        break
        
        if not os.path.exists(filepath):
            return jsonify({
                'error': 'File does not exist on disk',
                'requested_file': filename,
                'full_path': filepath,
                'available_files': os.listdir(app.config['OUTPUT_FOLDER']) if os.path.exists(app.config['OUTPUT_FOLDER']) else []
            }), 404
            
        return send_file(
            filepath,
            as_attachment=True,
            download_name=filename,
            mimetype='text/csv'
        )
    except Exception as e:
        return jsonify({'error': f'Error downloading file: {str(e)}'}), 500

@app.route('/files/clear', methods=['POST'])
def clear_generated_files():
    """Clear all generated files (optional cleanup endpoint)"""
    try:
        global generated_files
        
        # Remove files from disk
        removed_count = 0
        for file_info in generated_files:
            filepath = file_info['filepath']
            if os.path.exists(filepath):
                os.remove(filepath)
                removed_count += 1
        
        # Clear the tracking list
        generated_files = []
        
        return jsonify({
            'status': 'success',
            'message': f'Cleared {removed_count} generated files'
        })
        
    except Exception as e:
        return jsonify({'error': f'Error clearing files: {str(e)}'}), 500



# Load NY and CA license data from static files on startup
def load_state_license_data():
    ny_path = os.path.join('data', 'ny_medical_license_database_clean_standardized.csv')
    ca_path = os.path.join('data', 'ca_medical_license_database_clean_standardized.csv')
    try:
        if os.path.exists(ny_path):
            stored_data['ny_data'] = pd.read_csv(ny_path)
            print(f"Loaded NY license data from {ny_path}")
        else:
            print(f"NY license data not found at {ny_path}")
        if os.path.exists(ca_path):
            stored_data['ca_data'] = pd.read_csv(ca_path)
            print(f"Loaded CA license data from {ca_path}")
        else:
            print(f"CA license data not found at {ca_path}")
    except Exception as e:
        print(f"Error loading state license data: {e}")

load_state_license_data()
load_existing_files()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)