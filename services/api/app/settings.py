from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ai_provider: str = "mock"
    ai_provider_api_key: str = ""
    replicate_model_version: str = ""
    replicate_webhook_url: str = ""
    replicate_input_person_key: str = "image"
    replicate_input_garment_key: str = "garment"
    replicate_input_prompt_key: str = "prompt"

    catalog_json_path: str = ""
    flipkart_affiliate_id: str = ""
    flipkart_affiliate_token: str = ""
    flipkart_search_url: str = "https://affiliate-api.flipkart.net/affiliate/1.0/search.json"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
