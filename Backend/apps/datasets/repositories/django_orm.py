from typing import Optional, List
import uuid
from django.db import transaction
from apps.datasets.models import Dataset, DatasetVersion
from apps.datasets.repositories.interface import DatasetRepositoryInterface

class DjangoDatasetRepository(DatasetRepositoryInterface):
    def get_by_id(self, id: uuid.UUID) -> Optional[Dataset]:
        try:
            return Dataset.objects.get(id=id)
        except Dataset.DoesNotExist:
            return None

    def list_by_organization(self, org_id: uuid.UUID) -> List[Dataset]:
        return list(Dataset.objects.filter(organization_id=org_id))

    def create_dataset(self, org_id: uuid.UUID, name: str, description: str, user_id: uuid.UUID) -> Dataset:
        return Dataset.objects.create(
            organization_id=org_id,
            name=name,
            description=description,
            created_by_id=user_id
        )

    def get_version(self, dataset_id: uuid.UUID, version_number: int) -> Optional[DatasetVersion]:
        try:
            return DatasetVersion.objects.get(dataset_id=dataset_id, version_number=version_number)
        except DatasetVersion.DoesNotExist:
            return None

    def get_latest_version(self, dataset_id: uuid.UUID) -> Optional[DatasetVersion]:
        return DatasetVersion.objects.filter(dataset_id=dataset_id).order_by("-version_number").first()

    def create_version(
        self,
        dataset_id: uuid.UUID,
        file_path: str,
        storage_path: str,
        file_size: int,
        file_type: str,
        metadata_json: str,
        user_id: uuid.UUID
    ) -> DatasetVersion:
        with transaction.atomic():
            latest = self.get_latest_version(dataset_id)
            next_version = (latest.version_number + 1) if latest else 1
            
            return DatasetVersion.objects.create(
                dataset_id=dataset_id,
                version_number=next_version,
                file_path=file_path,
                storage_path=storage_path,
                file_size=file_size,
                file_type=file_type,
                metadata_json=metadata_json,
                created_by_id=user_id
            )
