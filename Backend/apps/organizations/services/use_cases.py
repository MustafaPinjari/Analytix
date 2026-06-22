from apps.organizations.repositories.interface import OrganizationRepositoryInterface
from apps.users.repositories.interface import UserRepositoryInterface
from apps.users.models import UserOrganizationRole, User
from core.exceptions import ValidationException, PermissionDeniedException, NotFoundException
import uuid
import logging
from django.utils.text import slugify

logger = logging.getLogger(__name__)

class CreateOrganizationUseCase:
    def __init__(self, org_repo: OrganizationRepositoryInterface):
        self.org_repo = org_repo

    def execute(self, name: str, user) -> dict:
        slug = slugify(name)
        if self.org_repo.get_by_slug(slug):
            slug = f"{slug}-{uuid.uuid4().hex[:6]}"

        org = self.org_repo.create(name=name, slug=slug)
        # Assign creator as ORG_ADMIN
        UserOrganizationRole.objects.create(
            user=user,
            organization=org,
            role="ORG_ADMIN"
        )
        return {"organization": org}


class InviteUserToOrganizationUseCase:
    def __init__(self, org_repo: OrganizationRepositoryInterface, user_repo: UserRepositoryInterface):
        self.org_repo = org_repo
        self.user_repo = user_repo

    def execute(self, org_id: uuid.UUID, email: str, role: str, actor_role: str) -> dict:
        if actor_role not in ["SUPER_ADMIN", "ORG_ADMIN"]:
            raise PermissionDeniedException("Only organization administrators can invite users.")

        if role not in ["ORG_ADMIN", "ANALYST", "VIEWER"]:
            raise ValidationException("Invalid organization role specified.")

        org = self.org_repo.get_by_id(org_id)
        if not org:
            raise NotFoundException("Organization not found.")

        email_clean = email.strip().lower()
        user = self.user_repo.get_by_email(email_clean)

        created_new_user = False
        if not user:
            # Create a placeholder inactive user
            temp_password = uuid.uuid4().hex
            user = self.user_repo.create(
                email=email_clean,
                password=temp_password,
                is_active=False,
                is_verified=False
            )
            created_new_user = True

        if UserOrganizationRole.objects.filter(user=user, organization=org).exists():
            raise ValidationException("User is already a member of this organization.")

        UserOrganizationRole.objects.create(
            user=user,
            organization=org,
            role=role
        )

        logger.info(f"User {email_clean} invited to organization {org.name} with role {role}.")
        
        return {
            "user": user,
            "organization": org,
            "role": role,
            "created_new_user": created_new_user
        }
