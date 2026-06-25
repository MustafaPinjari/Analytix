import os
import sqlite3
import pandas as pd
from typing import Dict, Any, List
import logging
from django.conf import settings
from core.exceptions import ValidationException

logger = logging.getLogger(__name__)

class AnalyticsEngine:
    def execute_query(
        self,
        file_path: str = None,
        df: pd.DataFrame = None,
        dimensions: List[str] = [],
        measures: List[Dict[str, str]] = [],
        filters: List[Dict[str, Any]] = []
    ) -> List[Dict[str, Any]]:
        # If df is directly provided, fall back to Pandas processing (or in-memory sqlite)
        if df is not None:
            return self._execute_pandas_fallback(df, dimensions, measures, filters)

        if not file_path:
            raise ValidationException("Either file_path or df must be provided.")

        try:
            # Construct database paths
            db_dir = os.path.join(settings.MEDIA_ROOT, "analytical_db")
            os.makedirs(db_dir, exist_ok=True)
            db_path = os.path.join(db_dir, "datasets.db")
            
            # Resolve table name from parquet file name
            filename = os.path.basename(file_path)
            hex_name = filename.split(".")[0]
            table_name = f"ds_{hex_name}"

            # Verify if table exists in SQLite, otherwise fallback/load it
            conn = sqlite3.connect(db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
                (table_name,)
            )
            table_exists = cursor.fetchone() is not None
            
            if not table_exists:
                logger.info(f"Table {table_name} not found in analytical DB. Loading parquet fallback.")
                # Load parquet
                df_loaded = pd.read_parquet(file_path)
                # Write to SQLite
                df_loaded.to_sql(table_name, conn, index=False, if_exists="replace")
                logger.info(f"Table {table_name} populated successfully in analytical DB.")

            # Compile and run the SQLite query
            sql_query, params = self.compile_sql(table_name, dimensions, measures, filters)
            logger.info(f"Executing SQLite push-down query: {sql_query} | Params: {params}")
            
            cursor.execute(sql_query, params)
            rows = cursor.fetchall()
            conn.close()

            # Map sqlite rows to list of dicts
            return [dict(row) for row in rows]

        except Exception as e:
            logger.error(f"SQL push-down failed or fell back: {str(e)}")
            # Try load as Pandas fallback as last-ditch effort
            try:
                if file_path:
                    df_fallback = pd.read_parquet(file_path)
                    return self._execute_pandas_fallback(df_fallback, dimensions, measures, filters)
            except Exception as fe:
                logger.error(f"Last-ditch Pandas fallback also failed: {str(fe)}")
            raise ValidationException(f"Mathematical execution error: {str(e)}")

    def compile_sql(
        self,
        table_name: str,
        dimensions: List[str],
        measures: List[Dict[str, str]],
        filters: List[Dict[str, Any]]
    ) -> tuple:
        select_clause = []
        group_by_clause = []
        where_clauses = []
        params = {}

        # 1. Dimensions
        for dim in dimensions:
            select_clause.append(f'"{dim}"')
            group_by_clause.append(f'"{dim}"')

        # 2. Measures
        for m in measures:
            field = m.get("field")
            agg_type = m.get("aggregation", "sum").lower()
            
            if agg_type == "avg":
                agg_func = "AVG"
            elif agg_type == "sum":
                agg_func = "SUM"
            elif agg_type == "count":
                agg_func = "COUNT"
            elif agg_type == "max":
                agg_func = "MAX"
            elif agg_type == "min":
                agg_func = "MIN"
            else:
                agg_func = "SUM"

            agg_key = f"{field}_{agg_type}"
            select_clause.append(f'{agg_func}("{field}") AS "{agg_key}"')

        if not select_clause:
            raise ValidationException("At least one dimension or measure must be specified.")

        # 3. Filters
        for idx, f in enumerate(filters):
            col = f.get("field")
            op = f.get("operator")
            val = f.get("value")

            param_name = f"val_{idx}"
            if op == "equals":
                where_clauses.append(f'"{col}" = :{param_name}')
                params[param_name] = val
            elif op == "not_equals":
                where_clauses.append(f'"{col}" != :{param_name}')
                params[param_name] = val
            elif op == "contains":
                where_clauses.append(f'"{col}" LIKE :{param_name}')
                params[param_name] = f"%{val}%"
            elif op == "greater_than":
                where_clauses.append(f'"{col}" > :{param_name}')
                params[param_name] = val
            elif op == "less_than":
                where_clauses.append(f'"{col}" < :{param_name}')
                params[param_name] = val
            elif op == "in":
                if isinstance(val, list):
                    placeholders = []
                    for val_idx, v in enumerate(val):
                        sub_param = f"val_{idx}_{val_idx}"
                        placeholders.append(f":{sub_param}")
                        params[sub_param] = v
                    where_clauses.append(f'"{col}" IN ({", ".join(placeholders)})')
                else:
                    where_clauses.append(f'"{col}" = :{param_name}')
                    params[param_name] = val
            elif op == "between":
                if isinstance(val, list) and len(val) == 2:
                    p1 = f"val_{idx}_0"
                    p2 = f"val_{idx}_1"
                    where_clauses.append(f'"{col}" BETWEEN :{p1} AND :{p2}')
                    params[p1] = val[0]
                    params[p2] = val[1]

        # Construct full SELECT
        sql = f"SELECT {', '.join(select_clause)} FROM \"{table_name}\""
        if where_clauses:
            sql += f" WHERE {' AND '.join(where_clauses)}"
        if group_by_clause:
            sql += f" GROUP BY {', '.join(group_by_clause)}"

        return sql, params

    def _execute_pandas_fallback(
        self,
        df: pd.DataFrame,
        dimensions: List[str] = [],
        measures: List[Dict[str, str]] = [],
        filters: List[Dict[str, Any]] = []
    ) -> List[Dict[str, Any]]:
        # Apply Filters
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
                raise ValidationException(f"Filter error on column '{col}': {str(e)}")

        # Build Aggregations Mapping
        agg_map = {}
        for m in measures:
            field = m.get("field")
            agg_type = m.get("aggregation", "sum").lower()
            
            if not field or field not in df.columns:
                continue

            pandas_func = "mean" if agg_type in ["avg", "mean"] else agg_type
            if pandas_func not in ["sum", "mean", "count", "max", "min"]:
                continue

            agg_key = f"{field}_{agg_type}"
            agg_map[agg_key] = (field, pandas_func)

        if not agg_map:
            raise ValidationException("At least one valid measure and aggregation must be specified.")

        # Apply Grouping
        if dimensions:
            valid_dims = [d for d in dimensions if d in df.columns]
            if not valid_dims:
                grouped = df.agg(**agg_map)
                grouped = pd.DataFrame([grouped])
            else:
                grouped = df.groupby(valid_dims).agg(**agg_map).reset_index()
        else:
            grouped = df.agg(**agg_map)
            grouped = pd.DataFrame([grouped])

        # Format output
        for col in grouped.columns:
            if pd.api.types.is_datetime64_any_dtype(grouped[col]):
                grouped[col] = grouped[col].dt.strftime("%Y-%m-%d %H:%M:%S")

        grouped = grouped.astype(object).where(pd.notnull(grouped), None)
        return grouped.to_dict(orient="records")
