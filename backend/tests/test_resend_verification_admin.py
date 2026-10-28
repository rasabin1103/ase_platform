from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.models.enums import UserStatus
from app.modules.users import service as users_service
from app.modules.users.service import UsersService


def _svc(user):
    svc = UsersService(MagicMock())
    svc.get_user = MagicMock(return_value=user)
    return svc


def _user(**kw):
    base = dict(uuid=uuid4(), email="a@b.com", status=UserStatus.active, email_verified_at=None)
    base.update(kw)
    return SimpleNamespace(**base)


@pytest.mark.parametrize("sent", [True, False])
def test_resend_reports_mail_result(sent):
    user = _user()
    with patch.object(users_service, "issue_and_send_verification_email", return_value=sent) as issue:
        got, ok = _svc(user).resend_verification_email(user.uuid)
    assert got is user and ok is sent
    issue.assert_called_once()


def test_resend_rejects_verified_user():
    user = _user(email_verified_at=datetime.now(timezone.utc))
    with patch.object(users_service, "issue_and_send_verification_email") as issue:
        with pytest.raises(HTTPException) as exc:
            _svc(user).resend_verification_email(user.uuid)
    assert exc.value.status_code == 400
    issue.assert_not_called()


def test_resend_rejects_deleted_user():
    user = _user(status=UserStatus.deleted)
    with patch.object(users_service, "issue_and_send_verification_email") as issue:
        with pytest.raises(HTTPException) as exc:
            _svc(user).resend_verification_email(user.uuid)
    assert exc.value.status_code == 400
    issue.assert_not_called()
