from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

import models
from services.auth_service import get_db, get_current_user
from services.simulation_service import simulation_runner

router = APIRouter()


class SimStartRequest(BaseModel):
    greenhouse_id: int
    interval_seconds: Optional[float] = 5.0
    loop: Optional[bool] = True


class SimStopRequest(BaseModel):
    greenhouse_id: int


def _check_ownership(db: Session, greenhouse_id: int, user: models.User) -> models.Greenhouse:
    g = (
        db.query(models.Greenhouse)
        .filter(
            models.Greenhouse.id == greenhouse_id,
            models.Greenhouse.owner_id == user.id,
        )
        .first()
    )
    if not g:
        raise HTTPException(status_code=403, detail="Bu seraya erişim yetkiniz yok")
    return g


@router.post("/start")
def start_simulation(
    req: SimStartRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _check_ownership(db, req.greenhouse_id, current_user)
    interval = max(0.5, float(req.interval_seconds or 5.0))
    return simulation_runner.start(req.greenhouse_id, interval, bool(req.loop))


@router.post("/stop")
def stop_simulation(
    req: SimStopRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _check_ownership(db, req.greenhouse_id, current_user)
    return simulation_runner.stop(req.greenhouse_id)


@router.get("/status/{greenhouse_id}")
def status_simulation(
    greenhouse_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _check_ownership(db, greenhouse_id, current_user)
    return simulation_runner.status(greenhouse_id)
