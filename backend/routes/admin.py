"""
Admin routes - User management, audit logs, statistics
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from pydantic import BaseModel

from db.session import get_pii_db
from db.pii_db import User, UserRole, LoginAttempt, PIIRecord
from routes.auth import get_current_user
from utils.logger import setup_logger

router = APIRouter()
logger = setup_logger()


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to require admin role"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


@router.get("/users")
async def list_users(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_pii_db)
):
    """List all users with their PII record counts (admin only)"""
    # specific fields and pii count
    users = db.query(
        User,
        func.count(PIIRecord.id).label("pii_count")
    ).outerjoin(PIIRecord).group_by(User.id).all()
    
    return {
        "users": [
            {
                "id": user.User.id,
                "email": user.User.email,
                "username": user.User.username,
                "role": user.User.role.value,
                "is_active": user.User.is_active,
                "is_locked": user.User.is_locked,
                "last_login": user.User.last_login.isoformat() if user.User.last_login else None,
                "created_at": user.User.created_at.isoformat(),
                "pii_count": user.pii_count
            }
            for user in users
        ]
    }


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_pii_db)
):
    """Delete a user and all their associated data (admin only)"""
    try:
        # Prevent self-deletion
        if user_id == admin_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own admin account"
            )

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Manually delete related records if no cascade is set up in DB
        # Delete PII records
        db.query(PIIRecord).filter(PIIRecord.user_id == user_id).delete()
        
        # Delete Login Attempts
        db.query(LoginAttempt).filter(LoginAttempt.email == user.email).delete()
        
        # Delete User
        db.delete(user)
        db.commit()
        
        return {"success": True, "message": f"User {user.email} and all associated data deleted"}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Delete user error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user"
        )


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    role: str,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_pii_db)
):
    """Update user role (admin only)"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Validate role
        try:
            new_role = UserRole(role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role"
            )
        
        user.role = new_role
        db.commit()
        
        return {"success": True, "message": f"User role updated to {role}"}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user role"
        )


@router.get("/audit")
async def get_audit_logs(
    limit: int = 100,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_pii_db)
):
    """Get security audit logs (admin only)"""
    attempts = db.query(LoginAttempt).order_by(
        LoginAttempt.timestamp.desc()
    ).limit(limit).all()
    
    return {
        "audit_logs": [
            {
                "id": attempt.id,
                "email": attempt.email,
                "ip_address": attempt.ip_address,
                "user_agent": attempt.user_agent,
                "success": attempt.success,
                "timestamp": attempt.timestamp.isoformat()
            }
            for attempt in attempts
        ]
    }


@router.get("/statistics")
async def get_statistics(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_pii_db)
):
    """Get system statistics (admin only)"""
    total_users = db.query(func.count(User.id)).scalar()
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    total_pii_records = db.query(func.count(PIIRecord.id)).scalar()
    total_login_attempts = db.query(func.count(LoginAttempt.id)).scalar()
    successful_logins = db.query(func.count(LoginAttempt.id)).filter(
        LoginAttempt.success == True
    ).scalar()
    
    return {
        "users": {
            "total": total_users,
            "active": active_users
        },
        "pii_records": {
            "total": total_pii_records
        },
        "login_attempts": {
            "total": total_login_attempts,
            "successful": successful_logins
        }
    }
