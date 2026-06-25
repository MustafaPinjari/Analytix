import os
import sys
import uuid
import subprocess
import logging
import re
import ast

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from django.conf import settings
from apps.datasets.models import Dataset, DatasetVersion
from apps.analytics.serializers import PythonSandboxSerializer
from core.permissions import HasTenantContext, IsAnalyst
from core.exceptions import NotFoundException, ValidationException

logger = logging.getLogger(__name__)

class PythonSandboxView(APIView):
    permission_classes = [IsAuthenticated, HasTenantContext, IsAnalyst]

    def post(self, request):
        serializer = PythonSandboxSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data["code"]
        dataset_id = serializer.validated_data.get("dataset_id")
        version_number = serializer.validated_data.get("version_number")

        dataset_path = None
        if dataset_id:
            try:
                dataset = Dataset.objects.get(id=dataset_id, organization=request.tenant)
            except Dataset.DoesNotExist:
                raise NotFoundException("Dataset not found in this organization.")

            if version_number is not None:
                try:
                    version = DatasetVersion.objects.get(dataset=dataset, version_number=version_number)
                except DatasetVersion.DoesNotExist:
                    raise NotFoundException(f"Dataset version {version_number} does not exist.")
            else:
                version = DatasetVersion.objects.filter(dataset=dataset).order_by("-version_number").first()
                if not version:
                    raise ValidationException("This dataset has no uploaded data versions yet.")

            dataset_path = os.path.abspath(version.storage_path)

        dataset_path_repr = repr(dataset_path) if dataset_path else "None"

        sandbox_dir = os.path.join(settings.MEDIA_ROOT, "sandbox")
        plots_dir = os.path.join(settings.MEDIA_ROOT, "sandbox_plots")
        os.makedirs(sandbox_dir, exist_ok=True)
        os.makedirs(plots_dir, exist_ok=True)

        plots_dir_repr = repr(plots_dir)

        # Build python script
        script_lines = [
            "import pandas as pd",
            "import numpy as np",
            "import matplotlib",
            "matplotlib.use('Agg')",
            "import matplotlib.pyplot as plt",
            "import seaborn as sns",
            "import os",
            "import uuid",
            "",
            "def _dummy_show(*args, **kwargs):",
            "    pass",
            "plt.show = _dummy_show",
            "",
            f"DATASET_PATH = {dataset_path_repr}",
            "df = None",
            "if DATASET_PATH:",
            "    try:",
            "        df = pd.read_parquet(DATASET_PATH)",
            "    except Exception:",
            "        pass",
            "",
            "# --- User Code ---",
            code,
            "# --- End User Code ---",
            "",
            "# --- Post-execution to save generated charts ---",
            "try:",
            f"    plots_dir = {plots_dir_repr}",
            "    os.makedirs(plots_dir, exist_ok=True)",
            "    fignums = plt.get_fignums()",
            "    saved_plots = []",
            "    for i in fignums:",
            "        fig = plt.figure(i)",
            "        filename = f'plot_{uuid.uuid4().hex}.png'",
            "        filepath = os.path.join(plots_dir, filename)",
            "        fig.savefig(filepath, bbox_inches=\"tight\")",
            "        saved_plots.append(filename)",
            "    print(f'__SAVED_PLOTS__:{saved_plots}')",
            "except Exception as pe:",
            "    print(f'__SAVED_PLOTS_ERROR__:{str(pe)}')",
        ]
        script_content = "\n".join(script_lines)

        temp_file_name = f"sandbox_{uuid.uuid4().hex}.py"
        temp_script_path = os.path.join(sandbox_dir, temp_file_name)

        with open(temp_script_path, "w", encoding="utf-8") as f:
            f.write(script_content)

        try:
            result = subprocess.run(
                [sys.executable, temp_script_path],
                capture_output=True,
                text=True,
                timeout=30
            )
            stdout = result.stdout
            stderr = result.stderr
            exit_code = result.returncode
        except subprocess.TimeoutExpired:
            return Response(
                {
                    "success": False,
                    "error": "Execution timed out after 30 seconds.",
                    "stdout": "",
                    "stderr": "TimeoutExpired: The script execution exceeded the 30-second time limit.",
                    "exit_code": -1,
                    "plots": []
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        finally:
            if os.path.exists(temp_script_path):
                try:
                    os.remove(temp_script_path)
                except Exception:
                    pass

        # Parse saved plots list from stdout
        saved_plots = []
        stdout_clean = stdout
        match = re.search(r"__SAVED_PLOTS__:\s*(\[.*?\])", stdout)
        if match:
            try:
                saved_plots = ast.literal_eval(match.group(1))
            except Exception:
                pass
            stdout_clean = re.sub(r"__SAVED_PLOTS__:\s*\[.*?\]", "", stdout).strip()

        # Check for errors in saving plots
        error_match = re.search(r"__SAVED_PLOTS_ERROR__:\s*(.*)", stdout)
        if error_match:
            logger.error(f"Sandbox plot saving error: {error_match.group(1)}")

        # Build absolute URLs for generated plots
        plot_urls = []
        for plot_file in saved_plots:
            url = request.build_absolute_uri(f"{settings.MEDIA_URL}sandbox_plots/{plot_file}")
            plot_urls.append(url)

        return Response(
            {
                "success": exit_code == 0,
                "stdout": stdout_clean,
                "stderr": stderr,
                "exit_code": exit_code,
                "plots": plot_urls
            },
            status=status.HTTP_200_OK if exit_code == 0 else status.HTTP_400_BAD_REQUEST
        )
