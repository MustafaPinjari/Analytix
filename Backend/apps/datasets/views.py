from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.files.storage import FileSystemStorage
from django.conf import settings
import os

from apps.datasets.models import Dataset, DatasetVersion, DatabaseConnection
from apps.datasets.serializers import (
    DatasetSerializer, 
    DatasetVersionSerializer, 
    DatasetUploadSerializer, 
    QueryConfigSerializer,
    DatabaseConnectionSerializer
)
from apps.datasets.repositories.django_orm import DjangoDatasetRepository
from apps.datasets.services.use_cases import ProcessDatasetUploadUseCase
from apps.analytics.services.engine import AnalyticsEngine
from core.permissions import HasTenantContext, IsViewer, IsAnalyst
from core.exceptions import NotFoundException, PermissionDeniedException, ValidationException

class DatasetListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), HasTenantContext(), IsAnalyst()]
        return [IsAuthenticated(), HasTenantContext(), IsViewer()]

    def get(self, request):
        datasets = Dataset.objects.filter(organization=request.tenant)
        serializer = DatasetSerializer(datasets, many=True)
        return Response({"success": True, "results": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = DatasetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        repo = DjangoDatasetRepository()
        dataset = repo.create_dataset(
            org_id=request.tenant.id,
            name=serializer.validated_data["name"],
            description=serializer.validated_data.get("description", ""),
            user_id=request.user.id
        )

        db_conn = serializer.validated_data.get("db_connection")
        sql_q = serializer.validated_data.get("sql_query")
        if db_conn or sql_q:
            dataset.db_connection = db_conn
            dataset.sql_query = sql_q
            dataset.save()

        return Response(
            {
                "success": True,
                "message": "Dataset profile created successfully.",
                "data": DatasetSerializer(dataset).data
            },
            status=status.HTTP_201_CREATED
        )


class DatasetVersionListView(APIView):
    permission_classes = [IsAuthenticated, HasTenantContext, IsViewer]

    def get(self, request, dataset_id):
        try:
            dataset = Dataset.objects.get(id=dataset_id, organization=request.tenant)
        except Dataset.DoesNotExist:
            raise NotFoundException("Dataset not found in this organization.")

        versions = DatasetVersion.objects.filter(dataset=dataset)
        serializer = DatasetVersionSerializer(versions, many=True)
        return Response({"success": True, "results": serializer.data}, status=status.HTTP_200_OK)


class DatasetUploadView(APIView):
    permission_classes = [IsAuthenticated, HasTenantContext, IsAnalyst]

    def post(self, request, dataset_id):
        try:
            dataset = Dataset.objects.get(id=dataset_id, organization=request.tenant)
        except Dataset.DoesNotExist:
            raise NotFoundException("Dataset not found in this organization.")

        serializer = DatasetUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uploaded_file = serializer.validated_data["file"]

        # Ensure target raw directory exists and save raw file
        raw_dir = os.path.join(settings.MEDIA_ROOT, "raw")
        os.makedirs(raw_dir, exist_ok=True)
        fs = FileSystemStorage(location=raw_dir)
        filename = fs.save(uploaded_file.name, uploaded_file)
        file_path = fs.path(filename)

        ext = uploaded_file.name.split(".")[-1].lower()

        repo = DjangoDatasetRepository()
        use_case = ProcessDatasetUploadUseCase(repo)

        result = use_case.execute(
            dataset_id=dataset.id,
            file_path=file_path,
            file_type=ext,
            user_id=request.user.id
        )

        return Response(
            {
                "success": True,
                "message": "Dataset uploaded and processed successfully.",
                "data": {
                    "version_number": result["version"].version_number,
                    "row_count": result["row_count"],
                    "columns": result["columns"]
                }
            },
            status=status.HTTP_201_CREATED
        )


class DatasetQueryView(APIView):
    permission_classes = [IsAuthenticated, HasTenantContext, IsViewer]

    def post(self, request, dataset_id):
        try:
            dataset = Dataset.objects.get(id=dataset_id, organization=request.tenant)
        except Dataset.DoesNotExist:
            raise NotFoundException("Dataset not found in this organization.")

        serializer = QueryConfigSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Check if database dataset
        if dataset.db_connection:
            from apps.datasets.services.adapters import get_db_adapter
            import pandas as pd
            sql_to_run = request.data.get("raw_sql") or dataset.sql_query
            if not sql_to_run:
                raise ValidationException("No SQL query configured for this database dataset.")
            try:
                adapter = get_db_adapter(dataset.db_connection)
                db_results = adapter.execute_raw_sql(sql_to_run)
                # Apply AnalyticsEngine grouping and aggregations if measures exist
                if serializer.validated_data.get("measures"):
                    df = pd.DataFrame(db_results)
                    engine = AnalyticsEngine()
                    results = engine.execute_query(
                        df=df,
                        dimensions=serializer.validated_data.get("dimensions", []),
                        measures=serializer.validated_data["measures"],
                        filters=serializer.validated_data.get("filters", [])
                    )
                else:
                    results = db_results

                return Response(
                    {
                        "success": True,
                        "dataset_id": str(dataset.id),
                        "results": results
                    },
                    status=status.HTTP_200_OK
                )
            except Exception as e:
                raise ValidationException(f"Database query execution error: {str(e)}")

        target_version = serializer.validated_data.get("version")

        if target_version:
            try:
                version = DatasetVersion.objects.get(dataset=dataset, version_number=target_version)
            except DatasetVersion.DoesNotExist:
                raise NotFoundException(f"Dataset version {target_version} does not exist.")
        else:
            version = DatasetVersion.objects.filter(dataset=dataset).order_by("-version_number").first()
            if not version:
                raise ValidationException("This dataset has no uploaded data versions yet.")

        # Execute analytical query using AnalyticsEngine
        engine = AnalyticsEngine()
        results = engine.execute_query(
            file_path=version.storage_path,
            dimensions=serializer.validated_data.get("dimensions", []),
            measures=serializer.validated_data["measures"],
            filters=serializer.validated_data.get("filters", [])
        )

        return Response(
            {
                "success": True,
                "dataset_id": str(dataset.id),
                "version_number": version.version_number,
                "results": results
            },
            status=status.HTTP_200_OK
        )


class DatabaseConnectionListCreateView(APIView):
    permission_classes = [IsAuthenticated, HasTenantContext, IsAnalyst]

    def get(self, request):
        connections = DatabaseConnection.objects.filter(organization=request.tenant)
        serializer = DatabaseConnectionSerializer(connections, many=True)
        return Response({"success": True, "results": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = DatabaseConnectionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        connection = serializer.save(
            organization=request.tenant,
            created_by=request.user
        )
        return Response(
            {
                "success": True,
                "message": "Database connection profile created successfully.",
                "data": DatabaseConnectionSerializer(connection).data
            },
            status=status.HTTP_201_CREATED
        )


class DatabaseConnectionTestView(APIView):
    permission_classes = [IsAuthenticated, HasTenantContext, IsAnalyst]

    def post(self, request):
        conn_id = request.data.get("id")
        if conn_id:
            try:
                connection = DatabaseConnection.objects.get(id=conn_id, organization=request.tenant)
            except DatabaseConnection.DoesNotExist:
                raise NotFoundException("Database connection profile not found.")
        else:
            serializer = DatabaseConnectionSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            connection = DatabaseConnection(**serializer.validated_data)
            
        from apps.datasets.services.adapters import get_db_adapter
        try:
            adapter = get_db_adapter(connection)
            ok = adapter.test_connection()
            if ok:
                return Response({"success": True, "message": "Connection test succeeded!"}, status=status.HTTP_200_OK)
            else:
                return Response({"success": False, "message": "Connection test failed. Check host/port parameters."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"success": False, "message": f"Connection error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class DatasetSQLCopilotView(APIView):
    permission_classes = [IsAuthenticated, HasTenantContext, IsViewer]

    def post(self, request, dataset_id):
        try:
            dataset = Dataset.objects.get(id=dataset_id, organization=request.tenant)
        except Dataset.DoesNotExist:
            raise NotFoundException("Dataset not found in this organization.")

        prompt = request.data.get("prompt")
        if not prompt:
            raise ValidationException("A prompt is required for the SQL Copilot.")

        # Get dataset schema columns
        serializer = DatasetSerializer(dataset)
        columns = serializer.data.get("columns", [])
        
        # Determine table name
        if dataset.db_connection:
            table_name = "sales_performance_2026"
        else:
            table_name = f"{dataset.name.lower().replace(' ', '_')}_data"

        # Apply heuristic generator
        generated_sql = self.generate_sql_from_prompt(prompt, table_name, columns)

        return Response(
            {
                "success": True,
                "generated_sql": generated_sql
            },
            status=status.HTTP_200_OK
        )

    def generate_sql_from_prompt(self, prompt, table_name, columns):
        import re
        prompt_lower = prompt.lower()
        
        # Identify numeric/string columns
        num_cols = [c['name'] for c in columns if c['type'] == 'number']
        all_cols = [c['name'] for c in columns]
        
        select_fields = []
        group_fields = []
        
        agg_func = None
        agg_col = None
        
        # Simple mapping for sales/units
        prompt_normalized = prompt_lower.replace("sales", "revenue")
        
        if "total" in prompt_normalized or "sum" in prompt_normalized:
            agg_func = "SUM"
        elif "average" in prompt_normalized or "avg" in prompt_normalized or "mean" in prompt_normalized:
            agg_func = "AVG"
        elif "count" in prompt_normalized or "number of" in prompt_normalized:
            agg_func = "COUNT"
        elif "maximum" in prompt_normalized or "highest" in prompt_normalized or "max" in prompt_normalized:
            agg_func = "MAX"
        elif "minimum" in prompt_normalized or "lowest" in prompt_normalized or "min" in prompt_normalized:
            agg_func = "MIN"
            
        if agg_func:
            best_num_col = None
            for col in num_cols:
                normalized_name = col.replace('_', ' ')
                if normalized_name in prompt_normalized or col in prompt_normalized:
                    best_num_col = col
                    break
            
            if not best_num_col:
                if agg_func == "COUNT":
                    agg_col = "*"
                elif num_cols:
                    agg_col = num_cols[0]
                else:
                    agg_col = "*"
            else:
                agg_col = best_num_col
                
            select_fields.append(f"{agg_func}({agg_col}) as {agg_func.lower()}_{agg_col}")
        
        # Look for group by dimensions (by X, each X)
        by_matches = re.findall(r'(?:by|each)\s+([a-zA-Z0-9_\s]+)', prompt_normalized)
        for match in by_matches:
            match_cleaned = match.strip()
            for col in all_cols:
                normalized_col = col.replace('_', ' ')
                if normalized_col in match_cleaned or col in match_cleaned:
                    if col not in group_fields:
                        group_fields.append(col)
                        
        for col in all_cols:
            if col not in num_cols and col not in group_fields:
                normalized_col = col.replace('_', ' ')
                if normalized_col in prompt_normalized or col in prompt_normalized:
                    group_fields.append(col)
                    
        for gf in group_fields:
            select_fields.insert(0, gf)
            
        if not select_fields:
            select_fields = ["*"]
            
        sql = f"SELECT {', '.join(select_fields)}\nFROM {table_name}"
        
        # Filter clauses
        where_clauses = []
        
        if "last" in prompt_normalized and "month" in prompt_normalized:
            month_match = re.search(r'last\s+(\d+)\s+month', prompt_normalized)
            months = int(month_match.group(1)) if month_match else 6
            if 'date' in all_cols:
                where_clauses.append(f"date >= date('now', '-{months} month')")
                
        str_cols = [c['name'] for c in columns if c['type'] == 'string']
        for sc in str_cols:
            normalized_sc = sc.replace('_', ' ')
            if sc in prompt_normalized or normalized_sc in prompt_normalized:
                pattern = rf'(?:{sc}|{normalized_sc})\s*(?:is|=|equals|in)\s*[\'"]?([a-zA-Z0-9_\s\-]+)[\'"]?'
                match = re.search(pattern, prompt_normalized)
                if match:
                    val = match.group(1).strip()
                    where_clauses.append(f"{sc} = '{val.title()}'")
                else:
                    if sc == 'region':
                        for r in ['Europe', 'Asia', 'North America', 'South America']:
                            if r.lower() in prompt_normalized:
                                where_clauses.append(f"region = '{r}'")
                                break
                    elif sc == 'category':
                        for c in ['Electronics', 'Office Supplies', 'Furniture', 'Apparel']:
                            if c.lower() in prompt_normalized:
                                where_clauses.append(f"category = '{c}'")
                                break
                                
        for nc in num_cols:
            normalized_nc = nc.replace('_', ' ')
            pattern = rf'(?:{nc}|{normalized_nc})\s*(>=|<=|>|<|=)\s*(\d+)'
            match = re.search(pattern, prompt_normalized)
            if match:
                op = match.group(1)
                val = match.group(2)
                where_clauses.append(f"{nc} {op} {val}")
            else:
                pattern_words = rf'(?:{nc}|{normalized_nc})\s*(?:greater than|more than)\s*(\d+)'
                match_w = re.search(pattern_words, prompt_normalized)
                if match_w:
                    where_clauses.append(f"{nc} > {match_w.group(1)}")
                    
        if where_clauses:
            sql += f"\nWHERE {' AND '.join(where_clauses)}"
            
        if group_fields:
            sql += f"\nGROUP BY {', '.join(group_fields)}"
            
        if agg_func and ("top" in prompt_normalized or "highest" in prompt_normalized or "best" in prompt_normalized or "order by" in prompt_normalized or "sort by" in prompt_normalized):
            sql += f"\nORDER BY {agg_func.lower()}_{agg_col} DESC"
            
        limit_match = re.search(r'limit\s+(\d+)', prompt_normalized)
        if limit_match:
            sql += f"\nLIMIT {limit_match.group(1)}"
        elif "top" in prompt_normalized:
            top_match = re.search(r'top\s+(\d+)', prompt_normalized)
            l = top_match.group(1) if top_match else 5
            sql += f"\nLIMIT {l}"
        elif "limit" not in prompt_normalized and select_fields == ["*"]:
            sql += "\nLIMIT 100"
            
        return sql + ";"

