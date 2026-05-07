import os
import uuid
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from app.core.config import settings

UPLOAD_DIR = "/app/uploads"
_client = None


def _has_s3() -> bool:
    return bool(settings.HETZNER_STORAGE_ACCESS_KEY and settings.HETZNER_STORAGE_SECRET_KEY)


def get_client():
    global _client
    if _client is None:
        _client = boto3.client(
            "s3",
            endpoint_url=settings.HETZNER_STORAGE_ENDPOINT,
            aws_access_key_id=settings.HETZNER_STORAGE_ACCESS_KEY,
            aws_secret_access_key=settings.HETZNER_STORAGE_SECRET_KEY,
            config=Config(signature_version="s3v4"),
        )
    return _client


def _save_local(key: str, file_bytes: bytes) -> None:
    path = os.path.join(UPLOAD_DIR, key)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(file_bytes)


def _local_url(key: str) -> str:
    return f"{settings.BACKEND_PUBLIC_URL}/uploads/{key}"


def upload_file(file_bytes: bytes, filename: str, mime_type: str, elderly_id: int) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
    key = f"elderly/{elderly_id}/documents/{uuid.uuid4()}.{ext}"

    if _has_s3():
        get_client().put_object(
            Bucket=settings.HETZNER_STORAGE_BUCKET,
            Key=key,
            Body=file_bytes,
            ContentType=mime_type,
            ACL="private",
        )
    else:
        _save_local(key, file_bytes)

    return key


def upload_photo(file_bytes: bytes, filename: str, mime_type: str, elderly_id: int) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    key = f"elderly/{elderly_id}/photos/{uuid.uuid4()}.{ext}"

    if _has_s3():
        get_client().put_object(
            Bucket=settings.HETZNER_STORAGE_BUCKET,
            Key=key,
            Body=file_bytes,
            ContentType=mime_type,
            ACL="private",
        )
    else:
        _save_local(key, file_bytes)

    return key


def get_photo_url(key: str, expires: int = 604800) -> str:
    if _has_s3():
        return get_client().generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.HETZNER_STORAGE_BUCKET, "Key": key},
            ExpiresIn=expires,
        )
    return _local_url(key)


def get_presigned_url(key: str, expires_in: int = 3600) -> str:
    if _has_s3():
        return get_client().generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.HETZNER_STORAGE_BUCKET,
                "Key": key,
                "ResponseContentDisposition": "inline",
            },
            ExpiresIn=expires_in,
        )
    return _local_url(key)


def delete_file(key: str) -> None:
    if _has_s3():
        try:
            get_client().delete_object(Bucket=settings.HETZNER_STORAGE_BUCKET, Key=key)
        except ClientError:
            pass
    else:
        path = os.path.join(UPLOAD_DIR, key)
        try:
            os.remove(path)
        except FileNotFoundError:
            pass
