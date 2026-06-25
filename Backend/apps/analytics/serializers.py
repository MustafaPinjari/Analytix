from rest_framework import serializers

class PythonSandboxSerializer(serializers.Serializer):
    code = serializers.CharField(required=True)
    dataset_id = serializers.UUIDField(required=False, allow_null=True)
    version_number = serializers.IntegerField(required=False, allow_null=True)
