from typing import Optional
import uuid
from apps.users.models import User
from apps.users.repositories.interface import UserRepositoryInterface

class DjangoUserRepository(UserRepositoryInterface):
    def get_by_id(self, id: uuid.UUID) -> Optional[User]:
        try:
            return User.objects.get(id=id)
        except User.DoesNotExist:
            return None

    def get_by_email(self, email: str) -> Optional[User]:
        try:
            return User.objects.get(email=email.strip().lower())
        except User.DoesNotExist:
            return None

    def create(self, **user_fields) -> User:
        password = user_fields.pop("password", None)
        user = User(**user_fields)
        if password:
            user.set_password(password)
        user.save()
        return user

    def save(self, user: User) -> User:
        user.save()
        return user
