import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Optional, Dict, Tuple
from apscheduler.schedulers.asyncio import AsyncIOScheduler

logger = logging.getLogger(__name__)

_executor = ThreadPoolExecutor(max_workers=2)


class ModelCache:
    def __init__(self):
        self._cache: Dict[Tuple[int, str], object] = {}

    def get(self, greenhouse_id: int, model_type: str) -> Optional[object]:
        return self._cache.get((greenhouse_id, model_type))

    def set(self, greenhouse_id: int, model_type: str, model: object) -> None:
        self._cache[(greenhouse_id, model_type)] = model

    def invalidate(self, greenhouse_id: int) -> None:
        keys = [k for k in self._cache if k[0] == greenhouse_id]
        for k in keys:
            del self._cache[k]


model_cache = ModelCache()


def _run_training(greenhouse_id: int) -> None:
    from database import SessionLocal
    from services.ml.trainer import trainer

    db = SessionLocal()
    try:
        event = trainer.train(db, greenhouse_id)
        logger.info(
            "Eğitim tamamlandı: sera=%d, durum=%s, süre=%.1fs",
            greenhouse_id,
            event.status,
            event.duration_seconds or 0,
        )
    except Exception as e:
        logger.error("Eğitim hatası (sera=%d): %s", greenhouse_id, str(e))
    finally:
        db.close()


async def check_and_train_async(greenhouse_id: int) -> None:
    from database import SessionLocal
    from services.ml.trainer import trainer

    db = SessionLocal()
    try:
        should = trainer.should_retrain(db, greenhouse_id)
    finally:
        db.close()

    if should:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(_executor, _run_training, greenhouse_id)


async def _periodic_sweep() -> None:
    from database import SessionLocal
    import models

    db = SessionLocal()
    try:
        greenhouses = db.query(models.Greenhouse).all()
        greenhouse_ids = [g.id for g in greenhouses]
    finally:
        db.close()

    for gh_id in greenhouse_ids:
        try:
            await check_and_train_async(gh_id)
        except Exception as e:
            logger.error("Periyodik eğitim hatası (sera=%d): %s", gh_id, str(e))


_scheduler: Optional[AsyncIOScheduler] = None


def start_scheduler() -> None:
    global _scheduler
    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(
        _periodic_sweep,
        trigger="cron",
        hour="*/6",
        id="periodic_training_sweep",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("ML eğitim zamanlayıcısı başlatıldı (her 6 saatte periyodik tarama)")


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown()