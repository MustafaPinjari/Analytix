from typing import Optional
import uuid
from apps.organizations.models import Organization
from apps.organizations.repositories.interface import OrganizationRepositoryInterface

class DjangoOrganizationRepository(OrganizationRepositoryInterface):
    def get_by_id(self, id: uuid.UUID) -> Optional[Organization]:
        try:
            return Organization.objects.get(id=id)
        except Organization.DoesNotExist:
            return None

    def get_by_slug(self, slug: str) -> Optional[Organization]:
        try:
            return Organization.objects.get(slug=slug)
        except Organization.DoesNotExist:
            return None

    def create(self, name: str, slug: str) -> Organization:
        return Organization.objects.create(name=name, slug=slug)

    def save(self, organization: Organization) -> Organization:
        organization.save()
        return organization
