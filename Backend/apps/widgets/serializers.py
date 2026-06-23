import json
from rest_framework import serializers
from apps.widgets.models import Widget

class WidgetSerializer(serializers.ModelSerializer):
    query_config = serializers.JSONField()

    class Meta:
        model = Widget
        fields = (
            "id",
            "dashboard",
            "dataset",
            "name",
            "type",
            "query_config",
            "position_x",
            "position_y",
            "width",
            "height",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_query_config(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("query_config must be a valid JSON object.")
        
        has_measures = "measures" in value and isinstance(value["measures"], list) and len(value["measures"]) > 0
        has_metrics = "metrics" in value and isinstance(value["metrics"], list) and len(value["metrics"]) > 0
        
        if not (has_measures or has_metrics):
            raise serializers.ValidationError("query_config must contain a 'measures' or 'metrics' list with at least one aggregate.")
        return value

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if isinstance(instance.query_config, str):
            try:
                ret["query_config"] = json.loads(instance.query_config)
            except Exception:
                ret["query_config"] = {}
        return ret

    def to_internal_value(self, data):
        ret = super().to_internal_value(data)
        if "query_config" in ret:
            ret["query_config"] = json.dumps(ret["query_config"])
        return ret
