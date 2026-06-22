from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Optional, List
import uuid

T = TypeVar("T")

class BaseRepository(ABC, Generic[T]):
    @abstractmethod
    def get_by_id(self, id: uuid.UUID) -> Optional[T]:
        pass

    @abstractmethod
    def list(self) -> List[T]:
        pass

    @abstractmethod
    def save(self, entity: T) -> T:
        pass

    @abstractmethod
    def delete(self, id: uuid.UUID) -> None:
        pass
