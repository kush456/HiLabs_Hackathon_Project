from flask import Blueprint, request, jsonify
import pandas as pd
from nameparser import HumanName
from rapidfuzz import fuzz, process
from unidecode import unidecode
import re
import os

standardization_bp = Blueprint('standardization', __name__)

# Helper functions from notebook

def split_name(s, delim=" "):
    parts = s.split(delim)
    if len(parts) == 1:
        first, middle, last = parts[0], "", ""
    elif len(parts) == 2:
        first, middle, last = parts[0], parts[1], ""
    else:
        first, middle, last = parts[0], " ".join(parts[1:-1]), parts[-1]
    return first, middle, last

def unmask_number(real, masked):
    if pd.isna(real) or pd.isna(masked):
        return masked
    real_str, masked_str = str(real), str(masked)
    if "*" not in masked_str:
        return masked
    if len(real_str) != len(masked_str):
        return masked
    for r, m in zip(real_str, masked_str):
        if m != "*" and r != m:
            return masked
    return real

@standardization_bp.route('/process/standardize', methods=['POST'])
def standardize_uploaded_file():
    """Standardize the uploaded provider roster CSV file before deduplication."""
    try:
        # Expecting a file upload
        if 'file' not in request.files:
            return jsonify({'error': 'No file part in the request'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        if not file.filename.lower().endswith('.csv'):
            return jsonify({'error': 'Only CSV files are supported'}), 400

        # Read CSV into DataFrame
        df = pd.read_csv(file)

        # Standardization logic from notebook
        if 'first_name' in df.columns:
            df["first_name"] = df["first_name"].apply(lambda x: x.split(" ")[0] if isinstance(x, str) else x)
        if 'practice_address_line1' in df.columns:
            df[["house_no_p","area_p","area_type_p"]] = df["practice_address_line1"].apply(lambda x : pd.Series(split_name(x)) if isinstance(x, str) else pd.Series([None, None, None]))
            df["area_type_p"] = df["area_type_p"].replace("Street", "St")
            df["area_type_p"] = df["area_type_p"].replace("Avenue", "Ave")
        if 'mailing_address_line1' in df.columns:
            df[["house_no_m","area_m","area_type_m"]] = df["mailing_address_line1"].apply(lambda x : pd.Series(split_name(x)) if isinstance(x, str) else pd.Series([None, None, None]))
            df["area_type_m"] = df["area_type_m"].replace("Street", "St")
            df["area_type_m"] = df["area_type_m"].replace("Avenue", "Ave")
        if 'practice_city' in df.columns:
            df["practice_city"] = df["practice_city"].apply(lambda x : x.capitalize() if isinstance(x, str) else x)
        if 'mailing_city' in df.columns:
            df["mailing_city"] = df["mailing_city"].apply(lambda x : x.capitalize() if isinstance(x, str) else x)
        if 'practice_phone' in df.columns:
            df["practice_phone"] = df["practice_phone"].apply(lambda x: re.sub(r"[^0-9]", "", x) if isinstance(x, str) else x)
        if set(['practice_zip','mailing_zip','house_no_p','house_no_m','area_p','area_m','area_type_p','area_type_m']).issubset(df.columns):
            df["practice_zip"] = df.apply(lambda x: unmask_number(x["mailing_zip"],x["practice_zip"]) if ((x["house_no_p"]==x["house_no_m"]) & (x["area_p"]==x["area_m"]) & (x["area_type_p"]==x["area_type_m"])) else x["practice_zip"],axis=1)
            df["mailing_zip"] = df.apply(lambda x: unmask_number(x["mailing_zip"],x["practice_zip"]) if ((x["house_no_p"]==x["house_no_m"]) & (x["area_p"]==x["area_m"]) & (x["area_type_p"]==x["area_type_m"])) else x["practice_zip"],axis=1)

        # Save standardized file to a temp location (or memory, or return as download)
        output_path = os.path.join('uploads', 'standardized_provider_roster.csv')
        df.to_csv(output_path, index=False)
        print(f"[standardization.py] Saved standardized file to: {os.path.abspath(output_path)}")
        print(f"[standardization.py] File exists after save? {os.path.exists(output_path)}")

        return jsonify({
            'status': 'success',
            'message': 'File standardized successfully',
            'standardized_file': output_path,
            'shape': df.shape,
            'columns': list(df.columns)
        })
    except Exception as e:
        return jsonify({'error': f'Error during standardization: {str(e)}'}), 500
