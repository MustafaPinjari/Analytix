import json
from rest_framework import serializers
from apps.datasets.models import Dataset, DatasetVersion

class DatasetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = ("id", "name", "description", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class DatasetVersionSerializer(serializers.ModelSerializer):
    metadata = serializers.SerializerMethodField()

    class Meta:
        model = DatasetVersion
        fields = ("id", "version_number", "file_size", "file_type", "metadata", "created_at")
        read_only_fields = ("id", "version_number", "file_size", "file_type", "metadata", "created_at")

    def get_metadata(self, obj):
        try:
            return json.loads(obj.metadata_json)
        except Exception:
            return {}


class DatasetUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, value):
        ext = value.name.split(".")[-1].lower()
        if ext not in ["csv", "xlsx"]:
            raise serializers.ValidationError("Only CSV and XLSX files are supported.")
        return value


class MeasureSerializer(serializers.Serializer):
    field = serializers.CharField(max_length=255)
    aggregation = serializers.ChoiceField(choices=(
        ("sum", "Sum"),
        ("count", "Count"),
        ("avg", "Average"),
        ("mean", "Mean"),
        ("max", "Maximum"),
        ("min", "Minimum"),
    ))


class FilterSerializer(serializers.Serializer):
    field = serializers.CharField(max_length=255)
    operator = serializers.ChoiceField(choices=(
        ("equals", "Equals"),
        ("not_equals", "Not Equals"),
        ("contains", "Contains"),
        ("greater_than", "Greater Than"),
        ("less_than", "Less Than"),
        ("in", "In List"),
        ("between", "Between Range"),
    ))
    value = serializers.JSONField()


class QueryConfigSerializer(serializers.Serializer):
    version = serializers.IntegerField(required=False, allow_null=True, default=None)
    dimensions = serializers.ListField(child=serializers.CharField(max_length=255), required=False, default=[])
    measures = serializers.ListField(child=MeasureSerializer())
    filters = serializers.ListField(child=FilterSerializer(), required=False, default=[])

