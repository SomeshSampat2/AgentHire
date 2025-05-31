import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # API Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # File Upload Configuration
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 10485760  # 10MB
    ALLOWED_EXTENSIONS: str = "pdf,docx,txt"
    
    # CORS Configuration
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"
    
    # Debug Mode
    DEBUG: bool = True
    
    # Gemini Model Configuration
    GEMINI_MODEL: str = "gemini-2.0-flash"
    GEMINI_TEMPERATURE: float = 0.1
    GEMINI_MAX_OUTPUT_TOKENS: int = 2048
    
    # Web Scraping Configuration
    SCRAPING_TIMEOUT: int = 30
    MAX_RETRIES: int = 3
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Allow extra fields in environment

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def allowed_extensions_list(self) -> List[str]:
        return [ext.strip().lower() for ext in self.ALLOWED_EXTENSIONS.split(",")]

    def is_file_allowed(self, filename: str) -> bool:
        """Check if file extension is allowed"""
        if not filename:
            return False
        extension = filename.rsplit('.', 1)[-1].lower()
        return extension in self.allowed_extensions_list

    def validate_gemini_api_key(self) -> bool:
        """Validate that GEMINI_API_KEY is provided and not empty"""
        return bool(self.GEMINI_API_KEY and self.GEMINI_API_KEY.strip())


# Global settings instance
settings = Settings() 