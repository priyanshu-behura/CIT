import os
import importlib
from unittest import mock
import jwt
import pytest
import app.core.security as security


def test_ephemeral_secret_generation_and_token_roundtrip():
    """
    (a) With no env var in a non-production environment, a token created by
    create_access_token verifies in the same process, and the key is not equal
    to the old hardcoded default string.
    """
    old_default = "-".join(["tech", "zephyr", "cit", "secret", "key", "2026", "hackathon", "token"])
    assert security.SECRET_KEY != old_default
    assert len(security.SECRET_KEY) >= 32

    payload = {"sub": "faculty.sm@cit.edu", "role": "faculty", "name": "Dr. Smruti Mohapatra"}
    token = security.create_access_token(payload)
    decoded = security.decode_access_token(token)

    assert decoded is not None
    assert decoded.get("sub") == "faculty.sm@cit.edu"
    assert decoded.get("role") == "faculty"


def test_token_signed_with_old_default_is_rejected():
    """
    (b) A token signed with the old default string is rejected by decode_access_token.
    """
    old_default = "-".join(["tech", "zephyr", "cit", "secret", "key", "2026", "hackathon", "token"])
    forged_token = jwt.encode(
        {"sub": "attacker@cit.edu", "role": "admin", "exp": 9999999999},
        old_default,
        algorithm="HS256"
    )
    decoded = security.decode_access_token(forged_token)
    assert decoded is None


def test_production_without_secret_raises_runtime_error():
    """
    (c) APP_ENV=production with no key raises a clear RuntimeError at import/startup.
    """
    env_overrides = {
        "APP_ENV": "production",
        "CIT_SECRET_KEY": "",
        "TECH_ZEPHYR_SECRET_KEY": ""
    }
    with mock.patch.dict(os.environ, env_overrides, clear=False):
        os.environ.pop("CIT_SECRET_KEY", None)
        os.environ.pop("TECH_ZEPHYR_SECRET_KEY", None)

        with pytest.raises(RuntimeError) as exc_info:
            importlib.reload(security)

        assert "Production startup failure" in str(exc_info.value)
        assert "CIT_SECRET_KEY" in str(exc_info.value)

    # Clean up and reload back to development mode
    with mock.patch.dict(os.environ, {"APP_ENV": "development"}, clear=False):
        os.environ.pop("CIT_SECRET_KEY", None)
        os.environ.pop("TECH_ZEPHYR_SECRET_KEY", None)
        importlib.reload(security)


def test_explicit_cit_secret_key_verification():
    """
    (d) With CIT_SECRET_KEY explicitly set, tokens sign and verify with that key.
    """
    custom_secret = "test-custom-cit-secure-token-secret-key-xyz-789"
    env_overrides = {
        "APP_ENV": "production",
        "CIT_SECRET_KEY": custom_secret
    }
    with mock.patch.dict(os.environ, env_overrides, clear=False):
        os.environ.pop("TECH_ZEPHYR_SECRET_KEY", None)
        importlib.reload(security)

        assert security.SECRET_KEY == custom_secret

        payload = {"sub": "admin@cit.edu", "role": "admin", "name": "Administrator"}
        token = security.create_access_token(payload)
        decoded = security.decode_access_token(token)

        assert decoded is not None
        assert decoded.get("sub") == "admin@cit.edu"
        assert decoded.get("role") == "admin"

    # Clean up and reload back to development mode
    with mock.patch.dict(os.environ, {"APP_ENV": "development"}, clear=False):
        os.environ.pop("CIT_SECRET_KEY", None)
        os.environ.pop("TECH_ZEPHYR_SECRET_KEY", None)
        importlib.reload(security)
