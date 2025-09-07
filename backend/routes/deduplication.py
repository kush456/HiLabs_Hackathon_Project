from flask import Blueprint, request, jsonify
from utils import generate_csv_file, dataframe_to_dict
from handlers import stored_data
from typing import List, Dict, Tuple
from datetime import datetime
import pandas as pd

# DSU and dedupe_simple function
class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0]*n

    def find(self, x):
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]
            x = self.parent[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return
        if self.rank[ra] < self.rank[rb]:
            self.parent[ra] = rb
        elif self.rank[rb] < self.rank[ra]:
            self.parent[rb] = ra
        else:
            self.parent[rb] = ra
            self.rank[ra] += 1

def dedupe_simple(
    df: pd.DataFrame,
    pk_col: str = "provider_id",
    first_col: str = "first_name",
    last_col: str = "last_name",
    phone_col: str = "practice_phone",
    license_col: str = "license_number",
    license_state_col: str = "license_state",    # optional; if not present, match on license only
    med_col: str = "medical_school",
    res_col: str = "residency_program",
    status_col: str = "status"                    # optional
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Returns (canonical_df, duplicates_df).
    canonical_df: one canonical row per cluster (kept)
    duplicates_df: all other rows that are duplicates and should be moved; includes duplicate_of and duplicate_reason
    """

    df = df.copy().reset_index(drop=True)
    n = len(df)
    # map index -> row id (original pk) for provenance
    df["_idx"] = df.index

    dsu = DSU(n)

    # helper to add unions for groups found by grouping keys
    def union_groupby(cols: List[str], reason_label: str):
        # only group if all columns exist
        if not all(c in df.columns for c in cols):
            return []
        groups = df.groupby(cols, dropna=True)
        edges = []
        for _, grp in groups:
            idxs = grp["_idx"].tolist()
            if len(idxs) > 1:
                base = idxs[0]
                for other in idxs[1:]:
                    dsu.union(base, other)
                    edges.append((base, other, reason_label))
        return edges

    # 1) name + phone
    edges_np = union_groupby([first_col, last_col, phone_col], "name_phone")
    # 2) license (+ state if present)
    lic_cols = [license_col] + ([license_state_col] if license_state_col in df.columns else [])
    edges_lic = union_groupby(lic_cols, "license")
    edges = edges_np + edges_lic
    # 3) name + education
    edges_ne = union_groupby([first_col, last_col, med_col, res_col], "name_edu")
    edges += edges_ne

    # Build clusters: root -> member idx list
    clusters: Dict[int, List[int]] = {}
    for i in range(n):
        root = dsu.find(i)
        clusters.setdefault(root, []).append(i)

    canonical_rows = []
    duplicate_rows = []

    # For quick lookup of reasons per pair, build a map (optional)
    pair_reasons = {}
    for u, v, r in edges:
        key = tuple(sorted((u, v)))
        pair_reasons.setdefault(key, set()).add(r)

    # choose canonical per cluster
    for root, members in clusters.items():
        if len(members) == 1:
            # singleton: treat as canonical
            idx = members[0]
            row = df.loc[idx].drop(labels=["_idx"]).to_dict()
            canonical_rows.append(row)
            continue

        # pick candidates subset (all members)
        comp = df.loc[members].copy()

        # 1) prefer status == "Active" if status_col exists
        chosen_idx = None
        if status_col in comp.columns:
            active = comp[comp[status_col] == "Active"]
            if len(active) > 0:
                # pick most complete among active
                comp_candidates = active
            else:
                comp_candidates = comp
        else:
            comp_candidates = comp

        # 2) pick row with most non-null fields (completeness)
        completeness = comp_candidates.count(axis=1)
        best_pos = completeness.idxmax()
        chosen_idx = int(df.loc[best_pos]["_idx"])

        # build canonical row
        canonical_rows.append(df.loc[chosen_idx].drop(labels=["_idx"]).to_dict())

        # mark others as duplicates with reasons
        for m in members:
            if m == chosen_idx:
                continue
            # gather reasons by checking any pair edges with cluster members (simple)
            reasons = set()
            for other in members:
                if other == m:
                    continue
                key = tuple(sorted((m, other)))
                if key in pair_reasons:
                    reasons.update(pair_reasons[key])
            if not reasons:
                reasons = {"unknown"}
            dup = df.loc[m].drop(labels=["_idx"]).to_dict()
            dup["duplicate_of"] = df.loc[chosen_idx].get(pk_col, chosen_idx)
            dup["duplicate_reason"] = "|".join(sorted(reasons))
            dup["moved_at"] = datetime.utcnow().isoformat()
            duplicate_rows.append(dup)

    canonical_df = pd.DataFrame(canonical_rows).reset_index(drop=True)
    duplicates_df = pd.DataFrame(duplicate_rows).reset_index(drop=True)

    return canonical_df, duplicates_df


deduplication_bp = Blueprint('deduplication', __name__)

@deduplication_bp.route('/process/complete-pipeline', methods=['POST'])
def complete_pipeline():
    """Run the complete data processing pipeline: split, merge, deduplicate by NPI and phone"""
    # Use misspelling_corrected_provider_roster.csv as the input for deduplication
    import os
    misspelling_path = os.path.join('uploads', 'misspelling_corrected_provider_roster.csv')
    print(f"[deduplication.py] Checking for misspelling-corrected file at: {os.path.abspath(misspelling_path)}")
    print(f"[deduplication.py] File exists? {os.path.exists(misspelling_path)}")
    if not os.path.exists(misspelling_path):
        print("[deduplication.py] ERROR: Misspelling-corrected provider roster file not found.")
        return jsonify({'error': 'Misspelling-corrected provider roster file not found. Please run misspelling correction first.'}), 400
    print(f"[deduplication.py] Using misspelling-corrected file: {misspelling_path}")
    initial_dataset = pd.read_csv(misspelling_path)
    print(f"[deduplication.py] Loaded initial_dataset with shape: {initial_dataset.shape}")

    ny_data = stored_data.get('ny_data')
    ca_data = stored_data.get('ca_data')

    try:
        npi = set(pd.read_csv("../backend/data/mock_npi_registry.csv")['npi'])
    except Exception as e:
        return jsonify({'error': f'Could not read NPI registry: {str(e)}'}), 500

    if any(data is None for data in [initial_dataset, ny_data, ca_data]):
        return jsonify({'error': 'Missing required data. Please upload and split datasets first.'}), 400

    # Track initial statistics before deduplication
    initial_total_rows = len(initial_dataset)
    print(f"[deduplication.py] Initial total rows before deduplication: {initial_total_rows}")

    initial_dataset["valid_npi"] = initial_dataset["npi"].isin(npi).astype(int)
    canonical, duplicates = dedupe_simple(initial_dataset)
    
    # Track final statistics after deduplication
    final_total_rows = len(canonical)
    duplicates_removed = initial_total_rows - final_total_rows
    print(f"[deduplication.py] Final total rows after deduplication: {final_total_rows}")
    print(f"[deduplication.py] Duplicates removed: {duplicates_removed}")
    
    print("initial columns:", initial_dataset.columns)
    print("canonical.columns:", canonical.columns)
    ny_data.rename(
        columns=lambda c: c if c.endswith("_gt") else f"{c}_gt",
        inplace=True
    )
    ca_data.rename(
        columns=lambda c: c if c.endswith("_gt") else f"{c}_gt",
        inplace=True
    )

    final_ca_data = pd.concat([
        pd.merge(canonical[canonical["practice_state"] == "CA"], ca_data, left_on="license_number", right_on="license_number_gt"),
        pd.merge(canonical[canonical["practice_state"] == "CA"], ca_data, left_on=["first_name", "last_name", "medical_school", "residency_program"], right_on=["first_name_gt", "last_name_gt", "medical_school_gt", "residency_program_gt"])
    ]).drop_duplicates("provider_id")
    final_ny_data = pd.concat([
        pd.merge(canonical[canonical["practice_state"] == "NY"], ny_data, left_on="license_number", right_on="license_number_gt"),
        pd.merge(canonical[canonical["practice_state"] == "NY"], ny_data, left_on=["first_name", "last_name", "medical_school", "house_no_p"], right_on=["first_name_gt", "last_name_gt", "medical_school_gt", "house_no_gt"])
    ]).drop_duplicates("provider_id")

    ca_final_file = generate_csv_file(final_ca_data, "ca_final_processed", "Complete Pipeline - CA Final Data")
    ny_final_file = generate_csv_file(final_ny_data, "ny_final_processed", "Complete Pipeline - NY Final Data")
    
    # Generate duplicates file
    duplicates_file = generate_csv_file(duplicates, "duplicates_removed", "Duplicate Records Removed During Deduplication")

    # Calculate final combined statistics
    final_combined_rows = len(final_ca_data) + len(final_ny_data)
    
    # Calculate quality score
    from routes.qualityScore import calculate_quality_score
    quality_metrics, quality_error = calculate_quality_score()
    if quality_error:
        print(f"[deduplication.py] Quality score calculation error: {quality_error}")
        quality_metrics = {'quality_score': 0, 'misspelling_ratio': 0, 'duplication_ratio': 0}
    
    # Calculate status distribution for pie charts
    ca_status_dist = {}
    ny_status_dist = {}
    
    if 'status_gt' in final_ca_data.columns:
        ca_status_counts = final_ca_data['status_gt'].value_counts()
        ca_status_dist = ca_status_counts.to_dict()
    
    if 'status_gt' in final_ny_data.columns:
        ny_status_counts = final_ny_data['status_gt'].value_counts()
        ny_status_dist = ny_status_counts.to_dict()
    
    # Calculate NPI validation statistics
    ca_valid_npi = 0
    ca_invalid_npi = 0
    ny_valid_npi = 0
    ny_invalid_npi = 0
    
    if 'valid_npi' in final_ca_data.columns:
        ca_valid_npi = int(final_ca_data['valid_npi'].sum())
        ca_invalid_npi = len(final_ca_data) - ca_valid_npi
    
    if 'valid_npi' in final_ny_data.columns:
        ny_valid_npi = int(final_ny_data['valid_npi'].sum())
        ny_invalid_npi = len(final_ny_data) - ny_valid_npi
    
    # Combined NPI validation statistics
    total_valid_npi = ca_valid_npi + ny_valid_npi
    total_invalid_npi = ca_invalid_npi + ny_invalid_npi
    total_records = total_valid_npi + total_invalid_npi
    
    # Prepare pipeline statistics with step-by-step data
    pipeline_steps = []
    
    # Step 1: Initial Upload (raw data before any processing)
    # Use the initial_total_rows which represents the data before deduplication
    pipeline_steps.append({
        'step': 'Initial Upload',
        'records': int(initial_total_rows),
        'description': 'Raw data uploaded to system'
    })
    
    # Step 2: Standardization (data after name and address standardization)
    # This should be the same count as initial since standardization doesn't remove rows
    standardization_count = initial_total_rows
    pipeline_steps.append({
        'step': 'Standardization', 
        'records': int(standardization_count),
        'description': 'Name and address standardization'
    })
    
    # Step 3: Misspelling Correction (data after fuzzy matching corrections)
    # This should also be the same count as we're correcting, not removing
    misspelling_corrected_count = initial_total_rows
    pipeline_steps.append({
        'step': 'Misspelling Correction',
        'records': int(misspelling_corrected_count),
        'description': 'Fuzzy matching and correction'
    })
    
    # Step 4: Deduplication (after removing duplicates)
    pipeline_steps.append({
        'step': 'Deduplication', 
        'records': int(final_total_rows),
        'description': 'Duplicate record removal'
    })
    
    # Step 5: Quality Check (final merged data with external sources)
    quality_check_count = len(final_ca_data) + len(final_ny_data)
    pipeline_steps.append({
        'step': 'Quality Check',
        'records': int(quality_check_count),
        'description': 'Final quality validation and merging'
    })

    pipeline_stats = {
        'initial': {
            'total_count': int(initial_total_rows)
        },
        'after_merge': {
            'ca_count': int(len(final_ca_data)), 
            'ny_count': int(len(final_ny_data)),
            'total_count': int(final_combined_rows)
        },
        'final': {
            'ca_count': int(len(final_ca_data)),
            'ny_count': int(len(final_ny_data)), 
            'total_count': int(final_combined_rows)
        },
        'deduplication': {
            'initial_rows': int(initial_total_rows),
            'final_rows': int(final_total_rows),
            'duplicates_removed': int(duplicates_removed),
            'duplicates_count': int(len(duplicates)),
            'removal_percentage': round((duplicates_removed / initial_total_rows * 100), 2) if initial_total_rows > 0 else 0
        },
        'pipeline_steps': pipeline_steps,
        'status_distribution': {
            'ca_status': ca_status_dist,
            'ny_status': ny_status_dist
        },
        'provider_distribution': {
            'ca_providers': int(len(final_ca_data)),
            'ny_providers': int(len(final_ny_data)),
            'total_providers': int(final_combined_rows)
        },
        'npi_validation': {
            'valid_count': int(total_valid_npi),
            'invalid_count': int(total_invalid_npi),
            'total_count': int(total_records),
            'valid_percentage': round((total_valid_npi / total_records * 100), 2) if total_records > 0 else 0,
            'invalid_percentage': round((total_invalid_npi / total_records * 100), 2) if total_records > 0 else 0,
            'ca_stats': {
                'valid': int(ca_valid_npi),
                'invalid': int(ca_invalid_npi),
                'total': int(len(final_ca_data))
            },
            'ny_stats': {
                'valid': int(ny_valid_npi),
                'invalid': int(ny_invalid_npi),
                'total': int(len(final_ny_data))
            }
        },
        'quality_metrics': quality_metrics
    }

    return jsonify({
        'status': 'success',
        'message': 'Complete pipeline executed successfully',
        'pipeline_stats': pipeline_stats,
        'generated_files': {
            'ca_final_file': ca_final_file,
            'ny_final_file': ny_final_file,
            'duplicates_file': duplicates_file
        },
        'final_data': {
            'ca_data': dataframe_to_dict(final_ca_data),
            'ny_data': dataframe_to_dict(final_ny_data)
        },
        'duplicates_data': dataframe_to_dict(duplicates)
    })
