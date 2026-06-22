from django.core.signing import TimestampSigner, SignatureExpired, BadSignature
from django.utils.text import slugify
from django.db import transaction
import logging
import uuid
from apps.users.repositories.interface import UserRepositoryInterface
from apps.organizations.models import Organization
from apps.users.models import UserOrganizationRole
from core.exceptions import ValidationException, NotFoundException, AuthenticationException

logger = logging.getLogger(__name__)

class RegisterUserUseCase:
    def __init__(self, user_repo: UserRepositoryInterface):
        self.user_repo = user_repo
        self.signer = TimestampSigner()

    def execute(self, email: str, password: str, first_name: str = "", last_name: str = "", org_name: str = None) -> dict:
        if self.user_repo.get_by_email(email):
            raise ValidationException("A user with this email already exists.")

        with transaction.atomic():
            user = self.user_repo.create(
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                is_active=False,
                is_verified=False
            )

            organization = None
            if org_name:
                slug = slugify(org_name)
                if Organization.objects.filter(slug=slug).exists():
                    slug = f"{slug}-{uuid.uuid4().hex[:6]}"
                
                organization = Organization.objects.create(
                    name=org_name,
                    slug=slug
                )
                UserOrganizationRole.objects.create(
                    user=user,
                    organization=organization,
                    role="ORG_ADMIN"
                )

            # Generate Verification Token
            token = self.signer.sign(str(user.id))
            
            # Celery task execution placeholder
            logger.info(f"Verification token generated for user ID {user.id} ({user.email}): {token}")

            return {
                "user": user,
                "organization": organization,
                "verification_token": token
            }


class VerifyEmailUseCase:
    def __init__(self, user_repo: UserRepositoryInterface):
        self.user_repo = user_repo
        self.signer = TimestampSigner()

    def execute(self, token: str) -> dict:
        try:
            # Token expires in 24 hours (86400 seconds)
            user_id_str = self.signer.unsign(token, max_age=86400)
            user_uuid = uuid.UUID(user_id_str)
        except SignatureExpired:
            raise ValidationException("Verification link has expired.")
        except (BadSignature, ValueError):
            raise ValidationException("Invalid verification link.")

        user = self.user_repo.get_by_id(user_uuid)
        if not user:
            raise NotFoundException("User not found.")

        if user.is_verified:
            return {"user": user, "message": "Email is already verified."}

        user.is_verified = True
        user.is_active = True
        self.user_repo.save(user)

        logger.info(f"User {user.email} verified successfully.")
        return {"user": user, "message": "Email verified successfully."}


class ForgotPasswordUseCase:
    def __init__(self, user_repo: UserRepositoryInterface):
        self.user_repo = user_repo
        self.signer = TimestampSigner()

    def execute(self, email: str) -> dict:
        user = self.user_repo.get_by_email(email)
        if not user:
            # We return success message even if email doesn't exist for security (prevent email enumeration)
            logger.warning(f"Password reset requested for non-existing email: {email}")
            return {"message": "If the email exists, a password reset link has been sent."}

        # Generate Reset Token
        token = self.signer.sign(str(user.id))
        logger.info(f"Password reset token generated for user ID {user.id} ({user.email}): {token}")
        
        # Celery task placeholder for sending reset email
        return {"message": "If the email exists, a password reset link has been sent.", "reset_token": token}


class ResetPasswordUseCase:
    def __init__(self, user_repo: UserRepositoryInterface):
        self.user_repo = user_repo
        self.signer = TimestampSigner()

    def execute(self, token: str, new_password: str) -> dict:
        try:
            # Token expires in 1 hour (3600 seconds)
            user_id_str = self.signer.unsign(token, max_age=3600)
            user_uuid = uuid.UUID(user_id_str)
        except SignatureExpired:
            raise ValidationException("Password reset link has expired.")
        except (BadSignature, ValueError):
            raise ValidationException("Invalid password reset link.")

        user = self.user_repo.get_by_id(user_uuid)
        if not user:
            raise NotFoundException("User not found.")

        user.set_password(new_password)
        self.user_repo.save(user)
        logger.info(f"Password reset successfully for user: {user.email}")
        
        return {"message": "Password reset successfully."}
