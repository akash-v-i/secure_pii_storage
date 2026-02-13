"""
Vault routes - PII data operations (store, retrieve, update, delete)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta

from db.session import get_pii_db, get_keys_db
from db.pii_db import PIIRecord, User, PIIFile, LoginAttempt, AuditLog
from db.key_db import FieldKey
from services.crypto_service import crypto_service
from routes.auth import get_current_user
from utils.logger import setup_logger
from fastapi import UploadFile, File
from fastapi.responses import StreamingResponse
from io import BytesIO

router = APIRouter()
logger = setup_logger()


def log_audit_event(
    db: Session,
    user: User,
    event_type: str,
    description: str,
    request: Request
):
    """Helper to log security events to the AuditLog table"""
    audit_entry = AuditLog(
        user_id=user.id,
        email=user.email,
        event_type=event_type,
        description=description,
        ip_address=request.client.host if request.client else "Unknown",
        user_agent=request.headers.get("user-agent", "Unknown")
    )
    db.add(audit_entry)
    db.commit()


class PIIStoreRequest(BaseModel):
    category: str  # basic_identifiers, government_identifiers, etc.
    pii_type: str  # ssn, passport, etc.
    type_label: str
    value: str  # Plain text value to encrypt
    label: str
    notes: Optional[str] = None
    expiry_date: Optional[str] = None


class PIIResponse(BaseModel):
    id: int
    category: str
    pii_type: str
    type_label: str
    value: str  # Will be encrypted or masked
    label: str
    notes: Optional[str]
    expiry_date: Optional[str]
    last_accessed: Optional[str]
    access_count: int
    created_at: str
    updated_at: str


class PIIUpdateRequest(BaseModel):
    label: Optional[str] = None
    notes: Optional[str] = None
    expiry_date: Optional[str] = None
    value: Optional[str] = None  # If updating the value


@router.post("/store")
async def store_pii(
    pii_request: PIIStoreRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    pii_db: Session = Depends(get_pii_db),
    keys_db: Session = Depends(get_keys_db)
):
    """Store encrypted PII data"""
    try:
        # Generate DEK first
        from utils.key_management import generate_dek
        dek, key_id = generate_dek()
        
        # Encrypt value with the DEK
        encrypted_value, nonce, key_id = crypto_service.encrypt_pii(pii_request.value, dek)
        
        # Wrap and store the DEK
        wrapped_key = crypto_service.wrap_dek(dek)
        key_record = FieldKey(
            key_id=key_id,
            wrapped_key=wrapped_key,
            master_key_version="1.0",
            is_active=True
        )
        keys_db.add(key_record)
        keys_db.commit()
        
        # Parse expiry date
        expiry_date = None
        if pii_request.expiry_date:
            try:
                expiry_date = datetime.fromisoformat(pii_request.expiry_date.replace('Z', '+00:00'))
            except:
                pass
        
        # Create PII record
        pii_record = PIIRecord(
            user_id=current_user.id,
            category=pii_request.category,
            pii_type=pii_request.pii_type,
            type_label=pii_request.type_label,
            encrypted_value=encrypted_value,
            nonce=nonce,
            key_id=key_id,
            label=pii_request.label,
            notes=pii_request.notes,
            expiry_date=expiry_date
        )
        
        pii_db.add(pii_record)
        pii_db.commit()
        pii_db.refresh(pii_record)
        
        logger.info(f"PII stored by user {current_user.id}: {pii_request.type_label}")
        
        # Log to audit database
        log_audit_event(
            pii_db, 
            current_user, 
            "PII_CREATE", 
            f"Created new PII record: {pii_request.type_label} ({pii_request.label})", 
            request
        )
        
        return {
            "success": True,
            "id": pii_record.id,
            "message": "PII encrypted and stored successfully"
        }
    
    except Exception as e:
        logger.error(f"Store PII error: {str(e)}")
        pii_db.rollback()
        keys_db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to store PII data"
        )


@router.get("/retrieve/{record_id}")
async def retrieve_pii(
    record_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    pii_db: Session = Depends(get_pii_db),
    keys_db: Session = Depends(get_keys_db)
):
    """Retrieve and decrypt PII data"""
    try:
        # Get PII record
        pii_record = pii_db.query(PIIRecord).filter(
            PIIRecord.id == record_id,
            PIIRecord.user_id == current_user.id
        ).first()
        
        if not pii_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PII record not found"
            )
        
        # Check for expiry (Crypto-Shred logic)
        if pii_record.expiry_date and pii_record.expiry_date < datetime.utcnow():
            # Shred the key for irreversible destruction
            key_record = keys_db.query(FieldKey).filter(
                FieldKey.key_id == pii_record.key_id
            ).first()
            if key_record and key_record.is_active:
                key_record.is_active = False
                keys_db.commit()
                logger.warning(f"Crypto-shredded key {pii_record.key_id} for expired record {record_id}")
            
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This record has expired and its encryption keys have been crypto-shredded for irreversible destruction."
            )
        
        # Get encryption key
        key_record = keys_db.query(FieldKey).filter(
            FieldKey.key_id == pii_record.key_id,
            FieldKey.is_active == True
        ).first()
        
        if not key_record:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Encryption key not found"
            )
        
        # Unwrap DEK
        dek = crypto_service.unwrap_dek(key_record.wrapped_key)
        
        # Decrypt value
        decrypted_value = crypto_service.decrypt_pii(
            pii_record.encrypted_value,
            pii_record.nonce,
            dek
        )
        
        # Update access tracking
        pii_record.last_accessed = datetime.utcnow()
        pii_record.access_count += 1
        pii_db.commit()
        
        logger.info(f"PII retrieved by user {current_user.id}: record {record_id}")
        
        # Log to audit database
        log_audit_event(
            pii_db, 
            current_user, 
            "PII_ACCESS", 
            f"Accessed and decrypted PII record: {pii_record.type_label} ({pii_record.label})", 
            request
        )
        
        return {
            **PIIResponse(
                id=pii_record.id,
                category=pii_record.category,
                pii_type=pii_record.pii_type,
                type_label=pii_record.type_label,
                value=decrypted_value,
                label=pii_record.label,
                notes=pii_record.notes,
                expiry_date=pii_record.expiry_date.isoformat() + "Z" if pii_record.expiry_date else None,
                last_accessed=pii_record.last_accessed.isoformat() + "Z" if pii_record.last_accessed else None,
                access_count=pii_record.access_count,
                created_at=pii_record.created_at.isoformat() + "Z",
                updated_at=pii_record.updated_at.isoformat() + "Z"
            ).dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Retrieve PII error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve PII data"
        )


@router.get("/list")
async def list_pii(
    current_user: User = Depends(get_current_user),
    pii_db: Session = Depends(get_pii_db)
):
    """List all PII records for current user (values are masked)"""
    try:
        records = pii_db.query(PIIRecord).filter(
            PIIRecord.user_id == current_user.id
        ).all()
        
        result = []
        for record in records:
            # Mask the encrypted value
            masked_value = "***" if len(record.encrypted_value) > 6 else "***"
            
            result.append({
                "id": record.id,
                "category": record.category,
                "pii_type": record.pii_type,
                "type_label": record.type_label,
                "value": masked_value,  # Masked for list view
                "label": record.label,
                "notes": record.notes,
                "expiry_date": record.expiry_date.isoformat() + "Z" if record.expiry_date else None,
                "last_accessed": record.last_accessed.isoformat() + "Z" if record.last_accessed else None,
                "access_count": record.access_count,
                "created_at": record.created_at.isoformat() + "Z",
                "updated_at": record.updated_at.isoformat() + "Z"
            })
        
        return {"records": result}
    
    except Exception as e:
        logger.error(f"List PII error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list PII records"
        )


@router.put("/update/{record_id}")
async def update_pii(
    record_id: int,
    pii_update: PIIUpdateRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    pii_db: Session = Depends(get_pii_db)
):
    """Update PII record metadata or value"""
    try:
        record = pii_db.query(PIIRecord).filter(
            PIIRecord.id == record_id,
            PIIRecord.user_id == current_user.id
        ).first()
        
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PII record not found"
            )
        
        # Update fields
        if pii_update.label is not None:
            record.label = pii_update.label
        if pii_update.notes is not None:
            record.notes = pii_update.notes
        if pii_update.expiry_date is not None:
            try:
                record.expiry_date = datetime.fromisoformat(pii_update.expiry_date.replace('Z', '+00:00'))
            except:
                pass
        
        # If updating value, re-encrypt
        if pii_update.value is not None:
            # This would require key retrieval and re-encryption
            # Simplified for now - in production, properly handle key rotation
            pass
        
        pii_db.commit()
        
        # Log to audit database
        log_audit_event(
            pii_db, 
            current_user, 
            "SETTINGS_CHANGE", 
            f"Updated PII record metadata: {record.type_label} ({record.label})", 
            request
        )
        
        return {"success": True, "message": "PII record updated"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update PII error: {str(e)}")
        pii_db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update PII record"
        )


@router.delete("/delete/{record_id}")
async def delete_pii(
    record_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    pii_db: Session = Depends(get_pii_db)
):
    """Delete PII record"""
    try:
        record = pii_db.query(PIIRecord).filter(
            PIIRecord.id == record_id,
            PIIRecord.user_id == current_user.id
        ).first()
        
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PII record not found"
            )
        
        # Store info for audit log before deletion
        type_label = record.type_label
        label = record.label
        
        pii_db.delete(record)
        pii_db.commit()
        
        logger.info(f"PII deleted by user {current_user.id}: record {record_id}")
        
        # Log to audit database
        log_audit_event(
            pii_db, 
            current_user, 
            "PII_DELETE", 
            f"Deleted PII record: {type_label} ({label})", 
            request
        )
        
        return {"success": True, "message": "PII record deleted"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete PII error: {str(e)}")
        pii_db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete PII record"
        )


# --- File Operations ---

@router.post("/files/upload")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    pii_db: Session = Depends(get_pii_db),
    keys_db: Session = Depends(get_keys_db)
):
    """Upload and encrypt a file"""
    try:
        if not file:
            raise HTTPException(status_code=400, detail="No file uploaded")
            
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Generate DEK
        from utils.key_management import generate_dek
        dek, key_id = generate_dek()
        
        # Encrypt content
        encrypted_hex, nonce_hex, key_id = crypto_service.encrypt_file(file_content, dek)
        
        # Store key
        wrapped_key = crypto_service.wrap_dek(dek)
        key_record = FieldKey(
            key_id=key_id,
            wrapped_key=wrapped_key,
            master_key_version="1.0",
            is_active=True
        )
        keys_db.add(key_record)
        keys_db.commit()
        
        # Store file record
        pii_file = PIIFile(
            user_id=current_user.id,
            filename=file.filename,
            content_type=file.content_type,
            size=file_size,
            encrypted_data=encrypted_hex,
            nonce=nonce_hex,
            key_id=key_id
        )
        
        pii_db.add(pii_file)
        pii_db.commit()
        pii_db.refresh(pii_file)
        
        # Log to audit database
        log_audit_event(
            pii_db, 
            current_user, 
            "FILE_UPLOAD", 
            f"Uploaded and encrypted file: {file.filename} ({file_size} bytes)", 
            request
        )
        
        return {
            "success": True,
            "id": pii_file.id,
            "message": "File uploaded and encrypted",
            "file": {
                "id": pii_file.id,
                "name": pii_file.filename,
                "size": pii_file.size,
                "type": pii_file.content_type,
                "uploadedAt": pii_file.uploaded_at.isoformat(),
                "encrypted": True
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File upload error: {str(e)}")
        pii_db.rollback()
        keys_db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )


@router.get("/files/list")
async def list_files(
    current_user: User = Depends(get_current_user),
    pii_db: Session = Depends(get_pii_db)
):
    """List all encrypted files for current user"""
    try:
        files = pii_db.query(PIIFile).filter(
            PIIFile.user_id == current_user.id
        ).order_by(PIIFile.uploaded_at.desc()).all()
        
        result = []
        for f in files:
            result.append({
                "id": f.id,
                "name": f.filename,
                "type": f.content_type,
                "size": f.size, # Send raw bytes, frontend can format
                "uploadedAt": f.uploaded_at.isoformat(),
                "encrypted": True
            })
            
        return {"files": result}
        
    except Exception as e:
        logger.error(f"List files error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list files"
        )


@router.get("/files/{file_id}/download")
async def download_file(
    file_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    pii_db: Session = Depends(get_pii_db),
    keys_db: Session = Depends(get_keys_db)
):
    """Download and decrypt a file"""
    try:
        # Get file record
        file_record = pii_db.query(PIIFile).filter(
            PIIFile.id == file_id,
            PIIFile.user_id == current_user.id
        ).first()
        
        if not file_record:
            raise HTTPException(status_code=404, detail="File not found")
            
        # Get key
        key_record = keys_db.query(FieldKey).filter(
            FieldKey.key_id == file_record.key_id,
            FieldKey.is_active == True
        ).first()
        
        if not key_record:
            raise HTTPException(status_code=500, detail="Encryption key not found")
            
        # Unwrap DEK
        dek = crypto_service.unwrap_dek(key_record.wrapped_key)
        
        # Decrypt content
        decrypted_bytes = crypto_service.decrypt_file(
            file_record.encrypted_data,
            file_record.nonce,
            dek
        )
        
        # Log to audit database
        log_audit_event(
            pii_db, 
            current_user, 
            "FILE_DOWNLOAD", 
            f"Decrypted and downloaded file: {file_record.filename}", 
            request
        )
        
        # Stream response
        return StreamingResponse(
            BytesIO(decrypted_bytes),
            media_type=file_record.content_type,
            headers={
                "Content-Disposition": f'attachment; filename="{file_record.filename}"'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download file error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to download file"
        )


@router.delete("/files/{file_id}")
async def delete_file(
    file_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    pii_db: Session = Depends(get_pii_db)
):
    """Delete a file"""
    try:
        file_record = pii_db.query(PIIFile).filter(
            PIIFile.id == file_id,
            PIIFile.user_id == current_user.id
        ).first()
        
        if not file_record:
            raise HTTPException(status_code=404, detail="File not found")
            
        # Store info for audit
        filename = file_record.filename
        
        pii_db.delete(file_record)
        pii_db.commit()
        
        # Log to audit database
        log_audit_event(
            pii_db, 
            current_user, 
            "PII_DELETE", 
            f"Deleted encrypted file: {filename}", 
            request
        )
        
        return {"success": True, "message": "File deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete file error: {str(e)}")
        pii_db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete file"
        )


@router.get("/alerts")
async def get_alerts(
    current_user: User = Depends(get_current_user),
    pii_db: Session = Depends(get_pii_db)
):
    """Get security alerts (expiring records, failed logins, etc.)"""
    try:
        alerts = []
        
        # 1. Check for expiring records (next 7 days)
        today = datetime.utcnow()
        next_week = today + timedelta(days=7)
        
        expiring = pii_db.query(PIIRecord).filter(
            PIIRecord.user_id == current_user.id,
            PIIRecord.expiry_date.isnot(None),
            PIIRecord.expiry_date >= today,
            PIIRecord.expiry_date <= next_week
        ).all()
        
        for record in expiring:
            days_left = (record.expiry_date - today).days
            alerts.append({
                "id": f"expiry-{record.id}",
                "type": "expiry",
                "title": "Record Expiring Soon",
                "description": f"Your {record.type_label} labeled '{record.label}' expires in {days_left} days.",
                "timestamp": record.created_at.isoformat() + "Z", # Use record creation or now?
                "isRead": False,
                "severity": "warning"
            })
            
        # 2. Check for recent failed login attempts (last 24 hours)
        yesterday = today - timedelta(days=1)
        failed_logins = pii_db.query(LoginAttempt).filter(
            LoginAttempt.email == current_user.email,
            LoginAttempt.success == False,
            LoginAttempt.timestamp >= yesterday
        ).order_by(LoginAttempt.timestamp.desc()).all()
        
        if failed_logins:
            alerts.append({
                "id": "failed-logins",
                "type": "failed_login",
                "title": "Recent Failed Logins",
                "description": f"{len(failed_logins)} failed login attempts detected in the last 24 hours.",
                "timestamp": failed_logins[0].timestamp.isoformat() + "Z",
                "isRead": False,
                "severity": "critical" if len(failed_logins) > 3 else "warning"
            })
            
        return {"alerts": alerts}
        
    except Exception as e:
        logger.error(f"Get alerts error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get alerts")


@router.get("/stats")
async def get_stats(
    current_user: User = Depends(get_current_user),
    pii_db: Session = Depends(get_pii_db)
):
    """Get privacy dashboard statistics"""
    try:
        # PII Count
        pii_count = pii_db.query(PIIRecord).filter(PIIRecord.user_id == current_user.id).count()
        
        # File Count & Size
        files = pii_db.query(PIIFile).filter(PIIFile.user_id == current_user.id).all()
        file_count = len(files)
        total_size = sum(f.size for f in files)
        
        # Expiring Count
        today = datetime.utcnow()
        next_month = today + timedelta(days=30)
        expiring_count = pii_db.query(PIIRecord).filter(
            PIIRecord.user_id == current_user.id,
            PIIRecord.expiry_date.isnot(None),
            PIIRecord.expiry_date <= next_month
        ).count()
        
        # Audit Logs (Login History count for now)
        audit_count = pii_db.query(LoginAttempt).filter(LoginAttempt.email == current_user.email).count()
        
        return {
            "piiCount": pii_count,
            "fileCount": file_count,
            "totalFileSize": total_size,
            "expiringCount": expiring_count,
            "auditCount": audit_count,
            "defaultRetention": "365 days" # Static for now
        }
        
    except Exception as e:
        logger.error(f"Get stats error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get stats")
