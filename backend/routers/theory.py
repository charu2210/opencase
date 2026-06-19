"""
Theory router — placeholder for future theory-ranking endpoints.
Theory evaluation logic lives in the investigator router for now.
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/modes")
def get_investigation_modes():
    """Return the available investigation modes and their descriptions."""
    return [
        {
            "id": "detective",
            "label": "Detective",
            "description": "Focus on suspects, motives, and opportunity. Who did it and why?",
            "icon": "🔍"
        },
        {
            "id": "scientist",
            "label": "Scientist",
            "description": "Assess evidence quality and uncertainty. What can the data actually prove?",
            "icon": "🧪"
        },
        {
            "id": "journalist",
            "label": "Journalist",
            "description": "Neutral reporting. Confirmed facts vs. allegations vs. unknowns.",
            "icon": "📰"
        },
        {
            "id": "historian",
            "label": "Historian",
            "description": "Historical context, parallels, and long-term significance.",
            "icon": "📚"
        }
    ]
