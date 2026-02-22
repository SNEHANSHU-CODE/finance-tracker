from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from jose import JWTError, jwt
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# IMPORTANT: This MUST match the SECRET_KEY used by Node.js auth service!
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

# Log warning if using default/fallback secret
if SECRET_KEY == "your-secret-key-change-in-production":
    logger.warning("⚠️ Using default SECRET_KEY! Change this in production!")
else:
    logger.info(f"✅ Using SECRET_KEY: {SECRET_KEY[:15]}... (length: {len(SECRET_KEY)})")

logger.info(f"✅ Using ALGORITHM: {ALGORITHM}")


def diagnose_token(token: str) -> None:
    """
    DEBUG FUNCTION: Decode token WITHOUT verification to inspect contents
    Useful for diagnosing JWT mismatches
    
    Args:
        token: JWT token string to inspect
    """
    import json
    import base64
    
    try:
        if token.startswith('Bearer '):
            token = token[7:]
        
        parts = token.split('.')
        if len(parts) != 3:
            logger.error(f"Invalid token format: expected 3 parts, got {len(parts)}")
            return
        
        # Decode header (add padding if needed)
        header_padded = parts[0] + '=' * (4 - len(parts[0]) % 4)
        header = json.loads(base64.urlsafe_b64decode(header_padded))
        logger.info(f"📋 Token header: {header}")
        logger.info(f"    Algorithm: {header.get('alg')}")
        
        # Decode payload
        payload_padded = parts[1] + '=' * (4 - len(parts[1]) % 4)
        payload_raw = json.loads(base64.urlsafe_b64decode(payload_padded))
        logger.info(f"📦 Token payload keys: {list(payload_raw.keys())}")
        logger.info(f"    userId: {payload_raw.get('userId')}")
        logger.info(f"    sub: {payload_raw.get('sub')}")
        logger.info(f"    user_id: {payload_raw.get('user_id')}")
        logger.info(f"    type: {payload_raw.get('type')}")
        logger.info(f"    exp: {payload_raw.get('exp')}")
        
        # Check signature secret
        logger.info(f"🔑 SECRET_KEY being used: '{SECRET_KEY[:20]}...{SECRET_KEY[-5:]}'")
        logger.info(f"🔑 SECRET_KEY length: {len(SECRET_KEY)}")
        logger.info(f"🔑 ALGORITHM: {ALGORITHM}")
        logger.warning("⚠️ Token decoded WITHOUT verification - signature may be invalid!")
        
    except Exception as e:
        logger.error(f"Error diagnosing token: {e}", exc_info=True)


def verify_token_signature(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify JWT token signature and decode payload
    Does NOT validate against database - just checks signature and expiration
    
    Args:
        token: JWT token string
        
    Returns:
        Token payload if valid signature, None otherwise
    """
    if not token:
        logger.debug("No token provided")
        return None
    
    try:
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        # Decode token using the SAME secret as Node.js service
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Check expiration
        exp = payload.get("exp")
        if exp and datetime.utcfromtimestamp(exp) < datetime.utcnow():
            logger.warning("Token expired")
            return None
        
        # Extract user ID - Node.js uses 'userId' claim key
        user_id = payload.get("userId") or payload.get("sub") or payload.get("user_id")
        token_type = payload.get("type", "unknown")
        
        logger.info(f"✅ Token signature verified (type: {token_type})")
        logger.debug(f"   User ID: {user_id}")
        logger.debug(f"   Token claims: {list(payload.keys())}")
        return payload
    
    except JWTError as e:
        logger.error(f"❌ JWT verification FAILED: {e}")
        logger.error(f"   SEC_KEY: {SECRET_KEY[:20]}...{SECRET_KEY[-5:]}")
        logger.error(f"   ALGORITHM: {ALGORITHM}")
        logger.debug(f"   Token preview: {token[:50]}...")
        # Help with debugging
        diagnose_token(token)
        return None
    except Exception as e:
        logger.error(f"Unexpected error verifying token: {e}")
        return None


async def authenticate_user(
    token: Optional[str],
    provided_user_id: Optional[str],
    user_service
) -> Tuple[bool, Dict[str, Any]]:
    """
    Complete authentication flow
    Handles both authenticated users (with token) and guest users (without token)
    Supports both email and Google authentication
    
    Args:
        token: JWT token (can be None for guests)
        provided_user_id: User ID provided by client (used for guests)
        user_service: UserService instance for database validation
        
    Returns:
        Tuple of (is_authenticated, user_data)
        - is_authenticated: True if user has valid token and exists in DB
        - user_data: Dict with user information
    """
    
    # ==========================================
    # SCENARIO 1: Token provided - Try to authenticate
    # ==========================================
    if token:
        logger.info("🔐 Token provided - attempting authentication")
        
        # Step 1: Verify token signature
        payload = verify_token_signature(token)
        
        if not payload:
            logger.warning("⚠️ Invalid token signature - falling back to guest mode")
            return False, _create_guest_user_data(provided_user_id, None)
        
        # Step 2: Extract user ID from token (Node.js uses 'userId' claim)
        user_id = payload.get("userId") or payload.get("sub") or payload.get("user_id")
        
        if not user_id:
            logger.warning("⚠️ Token missing user_id claim (checked: userId, sub, user_id) - falling back to guest mode")
            return False, _create_guest_user_data(provided_user_id, None)
        
        logger.debug(f"Extracted user_id from token: {user_id}")
        
        # Step 3: Validate user exists in database
        if not user_service:
            logger.warning("⚠️ UserService not available - skipping DB validation")
            # Still return authenticated=True based on valid token signature
            return True, _create_user_data_from_token(payload)
        
        try:
            # Check if user exists in MongoDB
            user = await user_service.get_user_by_id(user_id)
            
            if not user:
                logger.warning(f"⚠️ User {user_id} not found in database - falling back to guest mode")
                return False, _create_guest_user_data(provided_user_id, user_id)
            
            # Check if user is active
            if not user.isActive:
                logger.warning(f"⚠️ User {user_id} is inactive - falling back to guest mode")
                return False, _create_guest_user_data(provided_user_id, user_id)
            
            # ✅ SUCCESS: Valid token + User exists + User is active
            logger.info(f"✅ Authentication successful: {user.username} ({user.email}) via {user.authProvider}")
            
            # Update last login (non-blocking)
            try:
                await user_service.update_last_login(user_id, user.authProvider)
            except Exception as e:
                logger.error(f"Failed to update last login: {e}")
            
            # Return authenticated user data from database
            return True, _create_user_data_from_db(user)
            
        except Exception as e:
            logger.error(f"❌ Error validating user in database: {e}", exc_info=True)
            # On DB error, fall back to token data (degraded mode)
            logger.warning("Falling back to token-only authentication (DB unavailable)")
            return True, _create_user_data_from_token(payload)
    
    # ==========================================
    # SCENARIO 2: No token - Guest user
    # ==========================================
    else:
        logger.info("👤 No token provided - guest mode")
        return False, _create_guest_user_data(provided_user_id, None)


def _create_user_data_from_db(user) -> Dict[str, Any]:
    """
    Create user data dict from database user object
    Contains full user information from MongoDB
    """
    return {
        "user_id": user.id,
        "email": user.email,
        "username": user.username,
        "role": user.role,
        "is_guest": False,
        "is_active": user.isActive,
        "auth_provider": user.authProvider,
        "auth_methods": user.authMethods,
        "last_login_provider": user.lastLoginProvider,
        "preferences": {
            "currency": user.preferences.currency,
            "language": user.preferences.language,
            "theme": user.preferences.theme
        } if user.preferences else {},
        "google_id": user.googleId,
        "created_at": user.createdAt.isoformat() if user.createdAt else None,
        "last_login_at": user.lastLoginAt.isoformat() if user.lastLoginAt else None,
        "source": "database"
    }


def _create_user_data_from_token(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create user data dict from JWT token payload
    Used when DB is unavailable or as fallback
    """
    # Node.js uses 'userId' claim key
    user_id = payload.get("userId") or payload.get("sub") or payload.get("user_id")
    
    return {
        "user_id": user_id,
        "email": payload.get("email"),
        "username": payload.get("username"),
        "role": payload.get("role", "user"),
        "is_guest": False,
        "is_active": True,  # Assume active if token is valid
        "auth_provider": payload.get("authProvider", "email"),
        "auth_methods": payload.get("authMethods", ["email"]),
        "last_login_provider": payload.get("lastLoginProvider"),
        "preferences": payload.get("preferences", {}),
        "google_id": payload.get("googleId"),
        "source": "token"
    }


def _create_guest_user_data(
    provided_user_id: Optional[str],
    fallback_id: Optional[str]
) -> Dict[str, Any]:
    """
    Create guest user data
    
    Args:
        provided_user_id: User ID provided by client
        fallback_id: Fallback ID (e.g., from failed auth attempt)
    """
    import secrets
    
    # Generate guest ID
    if provided_user_id and provided_user_id.startswith("guest-"):
        guest_id = provided_user_id
    elif fallback_id:
        guest_id = f"guest-{fallback_id[:8]}"
    else:
        guest_id = f"guest-{secrets.token_hex(4)}"
    
    return {
        "user_id": guest_id,
        "email": None,
        "username": f"Guest_{guest_id[-8:]}",
        "role": "guest",
        "is_guest": True,
        "is_active": True,
        "auth_provider": None,
        "auth_methods": [],
        "last_login_provider": None,
        "preferences": {
            "currency": "USD",
            "language": "en",
            "theme": "light"
        },
        "google_id": None,
        "source": "guest"
    }


def get_auth_method_from_user(user_data: Dict[str, Any]) -> str:
    """
    Get authentication method display string
    
    Args:
        user_data: User data dict
        
    Returns:
        Human-readable auth method (e.g., "Email", "Google", "Email + Google")
    """
    if user_data.get("is_guest"):
        return "Guest"
    
    auth_methods = user_data.get("auth_methods", [])
    
    if not auth_methods:
        return user_data.get("auth_provider", "Unknown")
    
    if len(auth_methods) == 1:
        method = auth_methods[0]
        return method.capitalize()
    
    # Multiple auth methods
    return " + ".join([m.capitalize() for m in auth_methods])


# ==========================================
# Optional: Token creation (if needed)
# ==========================================

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token
    (Optional - mainly for testing or if Python needs to issue tokens)
    
    Args:
        data: Data to encode in token
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt