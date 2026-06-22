from abc import ABC, abstractmethod
from typing import Optional, List
import uuid
from apps.datasets.models import Dataset, DatasetVersion

class DatasetRepositoryInterface(ABC):
    @abstractmethod
    def get_by_id(self, id: uuid.UUID) -> Optional[Dataset]:
        pass

    @abstractmethod
    def list_by_organization(self, org_id: uuid.UUID) -> List[Dataset]:
        pass

    @abstractmethod
    def create_dataset(self, org_id: uuid.UUID, name: str, description: str, user_id: uuid.UUID) -> Dataset:
        pass

    @abstractmethod
    def get_version(self, dataset_id: uuid.UUID, version_number: int) -> Optional[DatasetVersion]:
        pass

    @abstractmethod
    def get_latest_version(self, dataset_id: uuid.UUID) -> Optional[DatasetVersion]:
        pass

    @abstractmethod
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
        pass
