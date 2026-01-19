"""
Cryptography service for PII encryption and decryption
Uses AES-GCM for authenticated encryption
"""
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import secrets
from typing import Tuple
from utils.key_management import generate_dek, wrap_key, unwrap_key, get_master_key


class CryptoService:
    """Service for encrypting and decrypting PII data"""
    
    def __init__(self):
        self.master_key = get_master_key()
    
    def encrypt_pii(self, plaintext: str, dek: bytes = None) -> Tuple[str, str, str]:
        """
        Encrypt PII data using AES-GCM
        Returns: (encrypted_hex, nonce_hex, key_id)
        """
        # Generate or use provided DEK
        if dek is None:
            dek, key_id = generate_dek()
        else:
            # If DEK provided, generate key_id from it
            import hashlib
            key_id = hashlib.sha256(dek).hexdigest()[:32]
        
        return self._encrypt_with_dek(plaintext, dek, key_id)
    
    def _encrypt_with_dek(self, plaintext: str, dek: bytes, key_id: str) -> Tuple[str, str, str]:
        
        # Generate nonce for GCM
        nonce = secrets.token_bytes(12)
        
        # Encrypt
        aesgcm = AESGCM(dek)
        ciphertext = aesgcm.encrypt(nonce, plaintext.encode('utf-8'), None)
        
        # Convert to hex strings for database storage
        encrypted_hex = ciphertext.hex()
        nonce_hex = nonce.hex()
        
        return encrypted_hex, nonce_hex, key_id
    
    def decrypt_pii(self, encrypted_hex: str, nonce_hex: str, dek: bytes) -> str:
        """
        Decrypt PII data using AES-GCM
        """
        # Convert from hex
        ciphertext = bytes.fromhex(encrypted_hex)
        nonce = bytes.fromhex(nonce_hex)
        
        # Decrypt
        aesgcm = AESGCM(dek)
        plaintext = aesgcm.decrypt(nonce, ciphertext, None)
        
        return plaintext.decode('utf-8')
    
    def encrypt_file(self, file_data: bytes, dek: bytes = None) -> Tuple[str, str, str]:
        """
        Encrypt File data using AES-GCM
        Returns: (encrypted_hex, nonce_hex, key_id)
        """
        # Generate or use provided DEK
        if dek is None:
            dek, key_id = generate_dek()
        else:
            # If DEK provided, generate key_id from it
            import hashlib
            key_id = hashlib.sha256(dek).hexdigest()[:32]
        
        # Generate nonce for GCM
        nonce = secrets.token_bytes(12)
        
        # Encrypt
        aesgcm = AESGCM(dek)
        ciphertext = aesgcm.encrypt(nonce, file_data, None)
        
        # Convert to hex strings for database storage
        encrypted_hex = ciphertext.hex()
        nonce_hex = nonce.hex()
        
        return encrypted_hex, nonce_hex, key_id

    def decrypt_file(self, encrypted_hex: str, nonce_hex: str, dek: bytes) -> bytes:
        """
        Decrypt File data using AES-GCM
        """
        # Convert from hex
        ciphertext = bytes.fromhex(encrypted_hex)
        nonce = bytes.fromhex(nonce_hex)
        
        # Decrypt
        aesgcm = AESGCM(dek)
        plaintext_bytes = aesgcm.decrypt(nonce, ciphertext, None)
        
        return plaintext_bytes

    def wrap_dek(self, dek: bytes) -> str:
        """Wrap (encrypt) a DEK with master key"""
        wrapped = wrap_key(dek, self.master_key)
        return wrapped.hex()
    
    def unwrap_dek(self, wrapped_hex: str) -> bytes:
        """Unwrap (decrypt) a DEK"""
        wrapped = bytes.fromhex(wrapped_hex)
        return unwrap_key(wrapped, self.master_key)


# Singleton instance
crypto_service = CryptoService()
