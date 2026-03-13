from .base import LLMClient
from .glm import GLMClient
from src.openrouter import OpenRouterClient


def get_llm_client(provider: str = "glm", *, model: str | None = None) -> LLMClient:
    provider_key = provider.strip().lower()
    if provider_key == "glm":
        return GLMClient(model=model)
    if provider_key == "openrouter":
        return OpenRouterClient(model=model)
    raise ValueError(f"Unsupported LLM provider: {provider}")
