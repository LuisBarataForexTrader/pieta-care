import uuid
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from app.core.config import settings

_client = None


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


def upload_file(file_bytes: bytes, filename: str, mime_type: str, elderly_id: int) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
    key = f"elderly/{elderly_id}/documents/{uuid.uuid4()}.{ext}"

    get_client().put_object(
        Bucket=settings.HETZNER_STORAGE_BUCKET,
        Key=key,
        Body=file_bytes,
        ContentType=mime_type,
        ACL="private",
    )
    return key


def get_presigned_url(key: str, expires_in: int = 3600) -> str:
    return get_client().generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.HETZNER_STORAGE_BUCKET, "Key": key},
        ExpiresIn=expires_in,
    )


def delete_file(key: str) -> None:
    try:
        get_client().delete_object(Bucket=settings.HETZNER_STORAGE_BUCKET, Key=key)
    except ClientError:
        pass
