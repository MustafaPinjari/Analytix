import os
import json
import uuid
import pandas as pd
from typing import Dict, Any, List
import logging
from apps.datasets.repositories.interface import DatasetRepositoryInterface
from core.exceptions import NotFoundException, ValidationException

logger = logging.getLogger(__name__)

class ProcessDatasetUploadUseCase:
    def __init__(self, dataset_repo: DatasetRepositoryInterface):
        self.dataset_repo = dataset_repo

    def execute(self, dataset_id: uuid.UUID, file_path: str, file_type: str, user_id: uuid.UUID) -> dict:
        dataset = self.dataset_repo.get_by_id(dataset_id)
        if not dataset:
            raise NotFoundException("Dataset profile not found.")

        try:
            if file_type.upper() == "CSV":
                df_sample = pd.read_csv(file_path, nrows=5000)
            elif file_type.upper() == "XLSX":
                df_sample = pd.read_excel(file_path, nrows=5000)
            else:
                raise ValidationException("Unsupported file type. Supported types are CSV and XLSX.")
        except Exception as e:
            logger.error(f"Failed to read dataset file: {str(e)}")
            raise ValidationException(f"Invalid file format: {str(e)}")

        # Detect columns and types
        columns = []
        for col in df_sample.columns:
            series = df_sample[col]
            inferred = "string"
            if pd.api.types.is_integer_dtype(series):
                inferred = "int"
            elif pd.api.types.is_numeric_dtype(series):
                inferred = "float"
            elif pd.api.types.is_datetime64_any_dtype(series):
                inferred = "datetime"
            elif pd.api.types.is_bool_dtype(series):
                inferred = "boolean"
            else:
                # Attempt date parse checks
                try:
                    pd.to_datetime(series.dropna().head(50), errors="raise")
                    inferred = "datetime"
                except (ValueError, TypeError):
                    inferred = "string"

            # Sanitize column name to lower alphanumeric with underscores
            sanitized_name = "".join(c if c.isalnum() else "_" for c in col.strip().lower())
            sanitized_name = "_".join(filter(None, sanitized_name.split("_")))

            columns.append({
                "original_name": col,
                "name": sanitized_name,
                "type": inferred,
                "nullable": bool(series.isnull().any())
            })

        # Calculate row count
        try:
            if file_type.upper() == "CSV":
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    row_count = sum(1 for _ in f) - 1
            else:
                df_full = pd.read_excel(file_path)
                row_count = df_full.shape[0]
        except Exception as e:
            logger.error(f"Failed to calculate row count: {str(e)}")
            row_count = len(df_sample)

        # Convert to binary Parquet
        parquet_filename = f"{uuid.uuid4().hex}.parquet"
        media_dir = os.path.dirname(file_path)
        parquet_dir = os.path.join(media_dir, "datasets")
        os.makedirs(parquet_dir, exist_ok=True)
        parquet_storage_path = os.path.join(parquet_dir, parquet_filename)

        try:
            if file_type.upper() == "CSV":
                df = pd.read_csv(file_path)
                df.columns = [
                    "_".join(filter(None, "".join(c if c.isalnum() else "_" for c in col.strip().lower()).split("_")))
                    for col in df.columns
                ]
                df.to_parquet(parquet_storage_path, engine="pyarrow")
            else:
                df_full = pd.read_excel(file_path)
                df_full.columns = [
                    "_".join(filter(None, "".join(c if c.isalnum() else "_" for c in col.strip().lower()).split("_")))
                    for col in df_full.columns
                ]
                df_full.to_parquet(parquet_storage_path, engine="pyarrow")
        except Exception as e:
            logger.error(f"Failed to convert dataset to Parquet: {str(e)}")
            raise ValidationException(f"Error compiling dataset to binary storage: {str(e)}")

        metadata = {
            "columns": columns,
            "row_count": row_count
        }

        try:
            file_size = os.path.getsize(file_path)
        except Exception:
            file_size = 0

        version = self.dataset_repo.create_version(
            dataset_id=dataset_id,
            file_path=file_path,
            storage_path=parquet_storage_path,
            file_size=file_size,
            file_type=file_type.upper(),
            metadata_json=json.dumps(metadata),
            user_id=user_id
        )

        return {
            "version": version,
            "columns": columns,
            "row_count": row_count
        }
