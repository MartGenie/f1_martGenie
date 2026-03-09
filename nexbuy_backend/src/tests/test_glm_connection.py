import asyncio

from src.model import get_llm_client


async def main() -> None:
    client = get_llm_client("glm")
    result = await client.chat(
        messages=[
            {
                "role": "user",
                "content": "说明你是什么模型，可以做什么。",
            }
        ],
        temperature=0.1,
        max_tokens=1024,
    )
    print("GLM response:", result.content)


if __name__ == "__main__":
    asyncio.run(main())
