import os
import uuid
import logging
from typing import Optional, Tuple
import aiofiles
from fastapi import UploadFile, HTTPException
import PyPDF2
from docx import Document
from io import BytesIO

from app.core.config import settings
from app.models.schemas import ResumeData

logger = logging.getLogger(__name__)


class FileService:
    def __init__(self):
        """Initialize file service with upload directory"""
        self.upload_dir = settings.UPLOAD_DIR
        os.makedirs(self.upload_dir, exist_ok=True)

    def validate_file(self, file: UploadFile) -> Tuple[bool, str]:
        """Validate uploaded file for security and format"""
        try:
            # Check file size
            if file.size and file.size > settings.MAX_FILE_SIZE:
                return False, f"File size exceeds maximum limit of {settings.MAX_FILE_SIZE} bytes"

            # Check file extension
            if not file.filename:
                return False, "No filename provided"

            if not settings.is_file_allowed(file.filename):
                return False, f"File type not allowed. Supported types: {settings.ALLOWED_EXTENSIONS}"

            # Additional security checks
            filename = file.filename.lower()
            
            # Check for dangerous file extensions
            dangerous_extensions = ['.exe', '.bat', '.cmd', '.scr', '.com', '.pif']
            if any(filename.endswith(ext) for ext in dangerous_extensions):
                return False, "Potentially dangerous file type detected"

            # Check for path traversal attempts
            if '..' in filename or '/' in filename or '\\' in filename:
                return False, "Invalid filename characters detected"

            return True, "File validation passed"

        except Exception as e:
            logger.error(f"Error validating file: {str(e)}")
            return False, "File validation failed"

    async def save_file(self, file: UploadFile) -> Tuple[bool, str, str]:
        """Save uploaded file securely and return file ID and path"""
        try:
            # Validate file first
            is_valid, message = self.validate_file(file)
            if not is_valid:
                return False, message, ""

            # Generate unique file ID and secure filename
            file_id = str(uuid.uuid4())
            file_extension = file.filename.rsplit('.', 1)[-1].lower()
            secure_filename = f"{file_id}.{file_extension}"
            file_path = os.path.join(self.upload_dir, secure_filename)

            # Save file
            async with aiofiles.open(file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)

            logger.info(f"File saved successfully: {file_id}")
            return True, "File saved successfully", file_id

        except Exception as e:
            logger.error(f"Error saving file: {str(e)}")
            return False, f"Failed to save file: {str(e)}", ""

    def get_file_path(self, file_id: str) -> Optional[str]:
        """Get file path from file ID"""
        try:
            # Find file with matching ID (any extension)
            for filename in os.listdir(self.upload_dir):
                if filename.startswith(file_id + '.'):
                    return os.path.join(self.upload_dir, filename)
            return None
        except Exception as e:
            logger.error(f"Error getting file path: {str(e)}")
            return None

    async def extract_text_from_file(self, file_id: str) -> Tuple[bool, str, str]:
        """Extract text content from uploaded file"""
        try:
            file_path = self.get_file_path(file_id)
            if not file_path:
                return False, "File not found", ""

            if not os.path.exists(file_path):
                return False, "File does not exist", ""

            file_extension = file_path.rsplit('.', 1)[-1].lower()
            
            if file_extension == 'pdf':
                text = await self._extract_pdf_text(file_path)
            elif file_extension == 'docx':
                text = await self._extract_docx_text(file_path)
            elif file_extension == 'txt':
                text = await self._extract_txt_text(file_path)
            else:
                return False, f"Unsupported file type: {file_extension}", ""

            if not text.strip():
                return False, "No text content found in file", ""

            return True, "Text extracted successfully", text

        except Exception as e:
            logger.error(f"Error extracting text from file: {str(e)}")
            return False, f"Failed to extract text: {str(e)}", ""

    async def _extract_pdf_text(self, file_path: str) -> str:
        """Extract text from PDF file"""
        try:
            text = ""
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting PDF text: {str(e)}")
            raise

    async def _extract_docx_text(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting DOCX text: {str(e)}")
            raise

    async def _extract_txt_text(self, file_path: str) -> str:
        """Extract text from TXT file"""
        try:
            async with aiofiles.open(file_path, 'r', encoding='utf-8') as file:
                text = await file.read()
            return text.strip()
        except UnicodeDecodeError:
            # Try with different encoding
            try:
                async with aiofiles.open(file_path, 'r', encoding='latin-1') as file:
                    text = await file.read()
                return text.strip()
            except Exception as e:
                logger.error(f"Error reading text file with latin-1 encoding: {str(e)}")
                raise
        except Exception as e:
            logger.error(f"Error extracting TXT text: {str(e)}")
            raise

    def cleanup_file(self, file_id: str) -> bool:
        """Delete file by file ID"""
        try:
            file_path = self.get_file_path(file_id)
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"File cleaned up: {file_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error cleaning up file: {str(e)}")
            return False

    def cleanup_old_files(self, max_age_hours: int = 24) -> int:
        """Clean up files older than specified hours"""
        try:
            import time
            current_time = time.time()
            deleted_count = 0
            
            for filename in os.listdir(self.upload_dir):
                file_path = os.path.join(self.upload_dir, filename)
                file_age_hours = (current_time - os.path.getctime(file_path)) / 3600
                
                if file_age_hours > max_age_hours:
                    try:
                        os.remove(file_path)
                        deleted_count += 1
                        logger.info(f"Cleaned up old file: {filename}")
                    except Exception as e:
                        logger.error(f"Error deleting old file {filename}: {str(e)}")
            
            return deleted_count
        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")
            return 0


# Global service instance
file_service = FileService() 