from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any, List

class ActivitySessionCreate(BaseModel):
    duration_seconds: int
    completed: bool
    accuracy: Optional[float] = None
    hints_used: Optional[int] = 0
    xp_earned: Optional[int] = 0
    mistakes_log: Optional[List[Dict[str, Any]]] = None

class ActivitySessionResponse(BaseModel):
    id: str
    activity_id: str
    user_id: str
    duration_seconds: int
    completed: bool
    accuracy: float
    
    model_config = ConfigDict(from_attributes=True)
