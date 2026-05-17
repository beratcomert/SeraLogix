"""
Simülasyon servisi: Veritabanındaki geçmiş sensor_data kayıtlarını kullanarak
modeli eğitir ve ardından kayıtları zaman sırasına göre tek tek yeni veri
(sanki Arduino'dan geliyormuş gibi) olarak sisteme besler.

Her sera için ayrı bir arka plan thread'i çalışır. Mod seçimi frontend
tarafından login ekranındaki toggle ile yönetilir; gerçek modda bu servis
hiç çalıştırılmaz, Arduino kendi verisini POST eder.
"""
from __future__ import annotations

import logging
import threading
from datetime import datetime
from typing import Dict, Optional

from database import SessionLocal
import models

logger = logging.getLogger(__name__)


class SimulationRunner:
    def __init__(self) -> None:
        self._threads: Dict[int, threading.Thread] = {}
        self._stop_flags: Dict[int, threading.Event] = {}
        self._status: Dict[int, dict] = {}
        self._lock = threading.Lock()

    def is_running(self, greenhouse_id: int) -> bool:
        t = self._threads.get(greenhouse_id)
        return bool(t and t.is_alive())

    def status(self, greenhouse_id: int) -> dict:
        base = {
            "greenhouse_id": greenhouse_id,
            "running": self.is_running(greenhouse_id),
        }
        base.update(self._status.get(greenhouse_id, {}))
        return base

    def start(self, greenhouse_id: int, interval_seconds: float = 2.0,
              loop: bool = True) -> dict:
        with self._lock:
            if self.is_running(greenhouse_id):
                return self.status(greenhouse_id)

            stop_flag = threading.Event()
            self._stop_flags[greenhouse_id] = stop_flag

            self._status[greenhouse_id] = {
                "started_at": datetime.utcnow().isoformat(),
                "interval_seconds": interval_seconds,
                "fed_rows": 0,
                "total_rows": 0,
                "phase": "starting",
                "loop": loop,
                "last_error": None,
            }

            thread = threading.Thread(
                target=self._run,
                args=(greenhouse_id, interval_seconds, loop, stop_flag),
                daemon=True,
                name=f"sim-{greenhouse_id}",
            )
            self._threads[greenhouse_id] = thread
            thread.start()

        return self.status(greenhouse_id)

    def stop(self, greenhouse_id: int) -> dict:
        flag = self._stop_flags.get(greenhouse_id)
        if flag:
            flag.set()
        st = self._status.get(greenhouse_id, {})
        st["phase"] = "stopping" if self.is_running(greenhouse_id) else st.get("phase", "stopped")
        return self.status(greenhouse_id)

    def _run(self, greenhouse_id: int, interval: float, loop: bool,
             stop_flag: threading.Event) -> None:
        db = SessionLocal()
        try:
            # 1) Geçmiş veriyi (zaman sırasıyla) yükle
            rows = (
                db.query(models.SensorData)
                .filter(models.SensorData.greenhouse_id == greenhouse_id)
                .order_by(models.SensorData.created_at.asc())
                .all()
            )
            historic = [
                {
                    "temperature": r.temperature,
                    "humidity": r.humidity,
                    "soil_moisture": r.soil_moisture,
                    "light": r.light,
                    "soil_temperature": r.soil_temperature,
                }
                for r in rows
            ]
            self._status[greenhouse_id]["total_rows"] = len(historic)

            if not historic:
                self._status[greenhouse_id]["phase"] = "no_data"
                self._status[greenhouse_id]["last_error"] = "Sera için geçmiş veri yok"
                return

            # 2) Modeli mevcut veriyle eğit
            self._status[greenhouse_id]["phase"] = "training"
            try:
                from services.ml.trainer import trainer
                trainer.train(db, greenhouse_id)
            except Exception as e:
                logger.warning("Sim eğitimi başarısız (sera=%d): %s", greenhouse_id, e)
                self._status[greenhouse_id]["last_error"] = f"train: {e}"

            # 3) Kayıtları sırayla yeni veri olarak DB'ye yaz
            self._status[greenhouse_id]["phase"] = "feeding"
            idx = 0
            fed = 0
            RETRAIN_EVERY = 40  # her N satırda modeli yeniden eğit
            while not stop_flag.is_set():
                row = historic[idx]
                try:
                    new_row = models.SensorData(
                        greenhouse_id=greenhouse_id,
                        temperature=row["temperature"],
                        humidity=row["humidity"],
                        soil_moisture=row["soil_moisture"],
                        light=row["light"],
                        soil_temperature=row["soil_temperature"],
                        created_at=datetime.utcnow(),
                    )
                    db.add(new_row)
                    db.commit()
                    fed += 1
                    self._status[greenhouse_id]["fed_rows"] = fed

                    # Periyodik yeniden eğitim: model versiyonu canlı yükselir
                    if fed % RETRAIN_EVERY == 0:
                        try:
                            from services.ml.trainer import trainer as _tr
                            _tr.train(db, greenhouse_id)
                        except Exception as e:
                            logger.warning("Sim yeniden eğitim başarısız (sera=%d): %s", greenhouse_id, e)
                except Exception as e:
                    db.rollback()
                    logger.error("Sim besleme hatası (sera=%d): %s", greenhouse_id, e)
                    self._status[greenhouse_id]["last_error"] = f"feed: {e}"

                idx += 1
                if idx >= len(historic):
                    if not loop:
                        break
                    idx = 0  # baştan başla

                stop_flag.wait(timeout=interval)

            self._status[greenhouse_id]["phase"] = (
                "stopped" if stop_flag.is_set() else "completed"
            )
        except Exception as e:
            logger.exception("Sim runner çöktü (sera=%d)", greenhouse_id)
            self._status[greenhouse_id]["phase"] = "error"
            self._status[greenhouse_id]["last_error"] = str(e)
        finally:
            db.close()


simulation_runner = SimulationRunner()
