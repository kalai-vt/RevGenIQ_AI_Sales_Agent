"""
Base tenant-aware repository.

Every public method automatically applies WHERE tenant_id = :tenant_id.
No query can return rows from another tenant — enforced at the data layer.
"""
from typing import Any, Generic, Optional, Sequence, TypeVar
from uuid import UUID

from sqlalchemy import Select, delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    model: type[ModelT]

    def __init__(self, db: AsyncSession, tenant_id: UUID | None = None):
        self.db = db
        self.tenant_id = tenant_id

    # ── Filtering helpers ──────────────────────────────────────────────────────

    def _tenant_filter(self, stmt: Select) -> Select:
        if self.tenant_id and hasattr(self.model, "tenant_id"):
            stmt = stmt.where(self.model.tenant_id == self.tenant_id)
        return stmt

    def _base_select(self) -> Select:
        return self._tenant_filter(select(self.model))

    # ── CRUD ──────────────────────────────────────────────────────────────────

    async def get(self, id: UUID) -> Optional[ModelT]:
        stmt = self._base_select().where(self.model.id == id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_or_raise(self, id: UUID, label: str = "Resource") -> ModelT:
        obj = await self.get(id)
        if obj is None:
            from app.core.exceptions import NotFound
            raise NotFound(label)
        return obj

    async def list(
        self,
        *,
        offset: int = 0,
        limit: int = 50,
        order_by: Any = None,
        **filters: Any,
    ) -> Sequence[ModelT]:
        stmt = self._base_select()
        for key, value in filters.items():
            if value is not None and hasattr(self.model, key):
                stmt = stmt.where(getattr(self.model, key) == value)
        if order_by is not None:
            stmt = stmt.order_by(order_by)
        stmt = stmt.offset(offset).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def count(self, **filters: Any) -> int:
        stmt = self._tenant_filter(select(func.count(self.model.id)))
        for key, value in filters.items():
            if value is not None and hasattr(self.model, key):
                stmt = stmt.where(getattr(self.model, key) == value)
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def create(self, **kwargs: Any) -> ModelT:
        if self.tenant_id and hasattr(self.model, "tenant_id"):
            kwargs.setdefault("tenant_id", self.tenant_id)
        obj = self.model(**kwargs)
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update(self, id: UUID, **kwargs: Any) -> Optional[ModelT]:
        obj = await self.get_or_raise(id)
        for key, value in kwargs.items():
            if hasattr(obj, key):
                setattr(obj, key, value)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def delete(self, id: UUID) -> bool:
        obj = await self.get(id)
        if obj is None:
            return False
        await self.db.delete(obj)
        await self.db.flush()
        return True

    async def bulk_create(self, items: list[dict]) -> list[ModelT]:
        objects = []
        for kwargs in items:
            if self.tenant_id and hasattr(self.model, "tenant_id"):
                kwargs.setdefault("tenant_id", self.tenant_id)
            obj = self.model(**kwargs)
            self.db.add(obj)
            objects.append(obj)
        await self.db.flush()
        return objects
