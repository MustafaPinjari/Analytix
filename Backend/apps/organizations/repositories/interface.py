from abc import ABC, abstractmethod
from typing import Optional, List
import uuid
from apps.organizations.models import Organization

class OrganizationRepositoryInterface(ABC):
    @abstractmethod
    def get_by_id(self, id: uuid.UUID) -> Optional[Organization]:
        pass

    @abstractmethod
    def get_by_slug(self, slug: str) -> Optional[Organization]:
        pass

    @abstractmethod
    def create(self, name: str, slug: str) -> Organization:
        pass

    @abstractmethod
    def save(self, organization: Organization) -> Organization:
        pass
