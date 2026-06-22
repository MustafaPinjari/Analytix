from abc import ABC, abstractmethod
from typing import Optional, List
import uuid
from apps.users.models import User

class UserRepositoryInterface(ABC):
    @abstractmethod
    def get_by_id(self, id: uuid.UUID) -> Optional[User]:
        pass

    @abstractmethod
    def get_by_email(self, email: str) -> Optional[User]:
        pass

    @abstractmethod
    def create(self, **user_fields) -> User:
        pass

    @abstractmethod
    def save(self, user: User) -> User:
        pass
