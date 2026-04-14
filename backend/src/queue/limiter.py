"""Concurrency limiter for multi-user agent runs."""
import asyncio
from dataclasses import dataclass, field

from ..config import MAX_CONCURRENT_REQUESTS


@dataclass
class QueueLimiter:
    max_concurrent: int = MAX_CONCURRENT_REQUESTS
    _semaphore: asyncio.Semaphore = field(init=False)
    _waiting: int = 0
    _active: int = 0

    def __post_init__(self) -> None:
        self._semaphore = asyncio.Semaphore(self.max_concurrent)

    @property
    def waiting(self) -> int:
        return self._waiting

    @property
    def active(self) -> int:
        return self._active

    async def acquire(self) -> int:
        """Acquire a slot. Returns queue position (0 = running immediately)."""
        if self._semaphore.locked():
            self._waiting += 1
            position = self._waiting
        else:
            position = 0

        await self._semaphore.acquire()

        if position > 0:
            self._waiting -= 1
        self._active += 1
        return position

    def release(self) -> None:
        self._active -= 1
        self._semaphore.release()


queue_limiter = QueueLimiter()
