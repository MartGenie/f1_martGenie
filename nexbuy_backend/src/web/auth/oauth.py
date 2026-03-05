from typing import Optional

from httpx_oauth.clients.google import GoogleOAuth2
from httpx_oauth.exceptions import GetIdEmailError

from .config import settings


class GoogleOIDCOAuth2(GoogleOAuth2):
    USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo"

    async def get_id_email(self, token: str) -> tuple[str, Optional[str]]:
        async with self.get_httpx_client() as client:
            response = await client.get(
                self.USERINFO_ENDPOINT,
                headers={**self.request_headers, "Authorization": f"Bearer {token}"},
            )

            if response.status_code >= 400:
                raise GetIdEmailError(response=response)

            payload = response.json()
            user_id = payload.get("sub")
            user_email = payload.get("email")

            if not user_id:
                raise GetIdEmailError("Missing subject claim in userinfo response.", response=response)

            return str(user_id), user_email


google_oauth_client = GoogleOIDCOAuth2(
    settings.google_oauth_client_id,
    settings.google_oauth_client_secret,
    scopes=["openid", "email", "profile"],
)
