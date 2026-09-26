from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "Story Arc Engine API"
    debug: bool = False
    port: int = 5000
    mongodb_uri: str = "mongodb://localhost:27017"  # env: MONGODB_URI
    mongodb_db_name: str = "story-arc-engine"
    gemini_api_key: str = ""
    frontend_url: str = "http://localhost:5173"
    rate_limit_requests: int = 100
    rate_limit_window_minutes: int = 15
    rate_limit_strict_requests: int = 10

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
