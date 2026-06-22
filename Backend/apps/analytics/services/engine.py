import pandas as pd
from typing import Dict, Any, List
import logging
from core.exceptions import ValidationException

logger = logging.getLogger(__name__)

class AnalyticsEngine:
    def execute_query(
        self,
        file_path: str,
        dimensions: List[str],
        measures: List[Dict[str, str]],
        filters: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        try:
            # Load Parquet file efficiently
            df = pd.read_parquet(file_path)
        except Exception as e:
            logger.error(f"Failed to read parquet data store: {str(e)}")
            raise ValidationException(f"Error loading dataset storage: {str(e)}")

        # 1. Apply Filters
        for f in filters:
            col = f.get("field")
            op = f.get("operator")
            val = f.get("value")
            
            if not col or col not in df.columns:
                continue

            try:
                if op == "equals":
                    df = df[df[col] == val]
                elif op == "not_equals":
                    df = df[df[col] != val]
                elif op == "contains":
                    df = df[df[col].astype(str).str.contains(str(val), case=False)]
                elif op == "greater_than":
                    df = df[df[col] > val]
                elif op == "less_than":
                    df = df[df[col] < val]
                elif op == "in":
                    if isinstance(val, list):
                        df = df[df[col].isin(val)]
                    else:
                        df = df[df[col] == val]
                elif op == "between":
                    if isinstance(val, list) and len(val) == 2:
                        df = df[(df[col] >= val[0]) & (df[col] <= val[1])]
            except Exception as e:
                logger.warning(f"Failed to apply filter {col} {op} {val}: {str(e)}")
                raise ValidationException(f"Filter error on column '{col}': {str(e)}")

        # 2. Build Aggregations Mapping
        agg_map = {}
        for m in measures:
            field = m.get("field")
            agg_type = m.get("aggregation", "sum").lower()
            
            if not field or field not in df.columns:
                continue

            # Standardize 'avg' to 'mean' in pandas
            pandas_func = "mean" if agg_type in ["avg", "mean"] else agg_type
            
            # Ensure aggregate type is standard
            if pandas_func not in ["sum", "mean", "count", "max", "min"]:
                continue

            # Key name for aggregated output column, e.g. "sales_sum"
            agg_key = f"{field}_{agg_type}"
            agg_map[agg_key] = (field, pandas_func)

        if not agg_map:
            raise ValidationException("At least one valid measure and aggregation must be specified.")

        # 3. Apply Grouping (if dimensions exist) and calculate Aggregations
        try:
            if dimensions:
                # Filter out any missing dimension fields
                valid_dims = [d for d in dimensions if d in df.columns]
                if not valid_dims:
                    # Fallback to global if dimensions are invalid
                    grouped = df.agg(**agg_map)
                    grouped = pd.DataFrame([grouped])
                else:
                    grouped = df.groupby(valid_dims).agg(**agg_map).reset_index()
            else:
                # Global calculations
                grouped = df.agg(**agg_map)
                grouped = pd.DataFrame([grouped])
        except Exception as e:
            logger.error(f"Aggregation execution failed: {str(e)}")
            raise ValidationException(f"Mathematical execution error: {str(e)}")

        # 4. Format Output Records (Convert timestamp columns to string for JSON compliance)
        for col in grouped.columns:
            if pd.api.types.is_datetime64_any_dtype(grouped[col]):
                grouped[col] = grouped[col].dt.strftime("%Y-%m-%d %H:%M:%S")

        # Handle null values in JSON response by converting to python None
        grouped = grouped.astype(object).where(pd.notnull(grouped), None)

        return grouped.to_dict(orient="records")
