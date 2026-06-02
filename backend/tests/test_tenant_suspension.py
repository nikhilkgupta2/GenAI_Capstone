import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.enums import TenantStatus, UserRole
from app.core.security import hash_password
from app.db.base import Base
from app.models.tenant import Tenant
from app.models.user import User
from app.services.auth_service import AuthService
from app.schemas.auth import LoginRequest
from app.api.deps import get_current_user
from fastapi.security import HTTPAuthorizationCredentials
from unittest.mock import MagicMock, patch

@pytest.fixture()
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture()
def suspended_tenant_user(db):
    tenant = Tenant(
        company_name="Suspended Retailer",
        contact_email="owner@suspended.com",
        status=TenantStatus.SUSPENDED,
    )
    user = User(
        tenant=tenant,
        name="Suspended Owner",
        email="owner@suspended.com",
        password_hash=hash_password("Password123!"),
        role=UserRole.RETAILER_ADMIN,
        is_active=True,
        is_email_verified=True,
    )
    db.add_all([tenant, user])
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture()
def active_tenant_user(db):
    tenant = Tenant(
        company_name="Active Retailer",
        contact_email="owner@active.com",
        status=TenantStatus.ACTIVE,
    )
    user = User(
        tenant=tenant,
        name="Active Owner",
        email="owner@active.com",
        password_hash=hash_password("Password123!"),
        role=UserRole.RETAILER_ADMIN,
        is_active=True,
        is_email_verified=True,
    )
    db.add_all([tenant, user])
    db.commit()
    db.refresh(user)
    return user

def test_login_suspended_tenant_raises_403(db, suspended_tenant_user):
    service = AuthService(db)
    payload = LoginRequest(email=suspended_tenant_user.email, password="Password123!")
    
    with pytest.raises(HTTPException) as exc:
        service.login(payload)
        
    assert exc.value.status_code == 403
    assert "suspended" in exc.value.detail.lower()

def test_login_active_tenant_succeeds(db, active_tenant_user):
    service = AuthService(db)
    payload = LoginRequest(email=active_tenant_user.email, password="Password123!")
    
    res = service.login(payload)
    assert res is not None
    assert res.user.email == active_tenant_user.email

@patch("app.api.deps.jwt.decode")
def test_get_current_user_suspended_tenant_raises_403(mock_decode, db, suspended_tenant_user):
    # Mock token decoding to return the suspended user's ID
    mock_decode.return_value = {"sub": str(suspended_tenant_user.id)}
    
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="fake-token")
    
    with pytest.raises(HTTPException) as exc:
        get_current_user(credentials=credentials, db=db)
        
    assert exc.value.status_code == 403
    assert "suspended" in exc.value.detail.lower()

@patch("app.api.deps.jwt.decode")
def test_get_current_user_active_tenant_succeeds(mock_decode, db, active_tenant_user):
    # Mock token decoding to return the active user's ID
    mock_decode.return_value = {"sub": str(active_tenant_user.id)}
    
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="fake-token")
    
    user = get_current_user(credentials=credentials, db=db)
    assert user.id == active_tenant_user.id
