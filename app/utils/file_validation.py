"""
File upload validation: magic-byte check, size limits, extension whitelist.
"""

from fastapi import HTTPException

# Magic bytes for allowed image types
MAGIC_BYTES = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"GIF87a": "image/gif",
    b"GIF89a": "image/gif",
    b"RIFF": "image/webp",  # WebP starts with RIFF
}

MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


def validate_image(content: bytes, filename: str = "") -> str:
    """
    Validates an uploaded image by magic bytes and size.
    Returns the detected MIME type.
    Raises HTTPException on failure.
    """
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Image too large (max 10 MB)")

    if len(content) < 8:
        raise HTTPException(status_code=400, detail="File too small to be a valid image")

    detected_mime = None
    for magic, mime in MAGIC_BYTES.items():
        if content[:len(magic)] == magic:
            detected_mime = mime
            break

    if not detected_mime:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.",
        )

    # WebP needs extra check (RIFF....WEBP)
    if detected_mime == "image/webp":
        if len(content) < 12 or content[8:12] != b"WEBP":
            raise HTTPException(status_code=400, detail="Invalid WebP file")

    return detected_mime
