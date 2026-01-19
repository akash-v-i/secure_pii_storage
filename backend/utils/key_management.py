"""
Key management utilities for encryption key handling
"""
import secrets
import hashlib
from typing import Tuple
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
import os


def generate_master_key() -> bytes:
    """Generate a master key (32 bytes for AES-256)"""
    return secrets.token_bytes(32)


def derive_key_from_password(password: str, salt: bytes) -> bytes:
    """Derive encryption key from password using PBKDF2"""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
        backend=default_backend()
    )
    return kdf.derive(password.encode())


def generate_dek() -> Tuple[bytes, str]:
    """
    Generate a Data Encryption Key (DEK)
    Returns: (dek_bytes, key_id)
    """
    dek = secrets.token_bytes(32)  # 256-bit key for AES-256
    key_id = hashlib.sha256(dek).hexdigest()[:32]  # Generate unique key ID
    return dek, key_id


def wrap_key(dek: bytes, master_key: bytes) -> bytes:
    """
    Wrap (encrypt) a DEK with the master key using AES-GCM
    """
    nonce = secrets.token_bytes(12)  # 96-bit nonce for GCM
    aesgcm = AESGCM(master_key)
    wrapped = aesgcm.encrypt(nonce, dek, None)
    return nonce + wrapped  # Store nonce with wrapped key


def unwrap_key(wrapped_key: bytes, master_key: bytes) -> bytes:
    """
    Unwrap (decrypt) a DEK using the master key
    """
    nonce = wrapped_key[:12]
    encrypted_dek = wrapped_key[12:]
    aesgcm = AESGCM(master_key)
    dek = aesgcm.decrypt(nonce, encrypted_dek, None)
    return dek


def get_master_key() -> bytes:
    """
    Get master key from environment variable or generate one
    In production, this should come from Azure Key Vault or similar
    """
    master_key_str = os.getenv("MASTER_ENCRYPTION_KEY")
    
    if master_key_str:
        # Convert hex string to bytes if stored as hex
        if len(master_key_str) == 64:  # 32 bytes = 64 hex chars
            return bytes.fromhex(master_key_str)
        return master_key_str.encode()[:32]
    
    # Fallback: generate from SECRET_KEY (not recommended for production)
    secret_key = os.getenv("SECRET_KEY", "default-secret-key-change-in-production")
    return hashlib.sha256(secret_key.encode()).digest()
