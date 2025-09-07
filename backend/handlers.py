
import os
from flask import jsonify, request
import pandas as pd
import io
from utils import dataframe_to_dict, generate_csv_file, allowed_file
from typing import Dict

stored_data = {
    'initial_dataset': None,
    'ny_data': None,
    'ca_data': None,
    'merged_ny': None,
    'merged_ca': None
}

def upload_initial_dataset_handler():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        if file and allowed_file(file.filename):
            # Save file to uploads folder, clearing previous uploads
            upload_folder = 'uploads'
            os.makedirs(upload_folder, exist_ok=True)
            # Remove all previous files in uploads
            for f in os.listdir(upload_folder):
                file_path_to_remove = os.path.join(upload_folder, f)
                if os.path.isfile(file_path_to_remove):
                    os.remove(file_path_to_remove)
            file_path = os.path.join(upload_folder, file.filename)
            file.save(file_path)
            # Read file into DataFrame
            df = pd.read_csv(file_path)
            stored_data['initial_dataset'] = df
            return jsonify({
                'status': 'success',
                'message': 'Initial dataset uploaded successfully',
                'data_info': {
                    'shape': df.shape,
                    'columns': df.columns.tolist(),
                    'saved_path': file_path
                }
            })
        else:
            return jsonify({'error': 'Invalid file type. Only CSV files are allowed'}), 400
    except Exception as e:
        return jsonify({'error': f'Error processing file: {str(e)}'}), 500

def upload_ny_license_data_handler():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        file = request.files['file']
        if file and allowed_file(file.filename):
            # Save file to uploads folder
            upload_folder = 'uploads'
            os.makedirs(upload_folder, exist_ok=True)
            file_path = os.path.join(upload_folder, file.filename)
            file.save(file_path)
            # Read file into DataFrame
            df = pd.read_csv(file_path)
            stored_data['ny_data'] = df
            return jsonify({
                'status': 'success',
                'message': 'NY license data uploaded successfully',
                'data_info': {
                    'shape': df.shape,
                    'columns': df.columns.tolist(),
                    'saved_path': file_path
                }
            })
        else:
            return jsonify({'error': 'Invalid file type'}), 400
    except Exception as e:
        return jsonify({'error': f'Error processing NY license data: {str(e)}'}), 500

def upload_ca_license_data_handler():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        file = request.files['file']
        if file and allowed_file(file.filename):
            # Save file to uploads folder
            upload_folder = 'uploads'
            os.makedirs(upload_folder, exist_ok=True)
            file_path = os.path.join(upload_folder, file.filename)
            file.save(file_path)
            # Read file into DataFrame
            df = pd.read_csv(file_path)
            stored_data['ca_data'] = df
            return jsonify({
                'status': 'success',
                'message': 'CA license data uploaded successfully',
                'data_info': {
                    'shape': df.shape,
                    'columns': df.columns.tolist(),
                    'saved_path': file_path
                }
            })
        else:
            return jsonify({'error': 'Invalid file type'}), 400
    except Exception as e:
        return jsonify({'error': f'Error processing CA license data: {str(e)}'}), 500
