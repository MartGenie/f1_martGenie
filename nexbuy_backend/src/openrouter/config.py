from pydantic_settings import BaseSettings, SettingsConfigDict


class OpenRouterSettings(BaseSettings):
    api_key: str = ""
    model_name: str = "minimax/minimax-m2.5"
    base_url: str = "https://openrouter.ai/api/v1"
    http_referer: str = ""
    app_title: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="OPENROUTER_",
        extra="ignore",
    )


openrouter_settings = OpenRouterSettings()
