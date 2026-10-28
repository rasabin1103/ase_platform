from unittest.mock import MagicMock, patch

from app.core import email as email_mod
from app.core.config import settings


def _resp(status=200, text="{}"):
    r = MagicMock()
    r.status_code = status
    r.text = text
    return r


def test_uses_resend_when_key_set(monkeypatch):
    monkeypatch.setattr(settings, "RESEND_API_KEY", "re_test")
    monkeypatch.setattr(settings, "SMTP_HOST", None)
    with patch.object(email_mod.httpx, "post", return_value=_resp(200)) as post:
        ok = email_mod.send_email(to_email="a@b.com", subject="S", html_body="<p>x</p>", reply_to="r@b.com")
    assert ok is True
    kwargs = post.call_args.kwargs
    assert kwargs["headers"]["Authorization"] == "Bearer re_test"
    assert kwargs["json"]["to"] == ["a@b.com"]
    assert kwargs["json"]["reply_to"] == "r@b.com"


def test_resend_failure_returns_false(monkeypatch):
    monkeypatch.setattr(settings, "RESEND_API_KEY", "re_test")
    with patch.object(email_mod.httpx, "post", return_value=_resp(403, "domain not verified")):
        assert email_mod.send_email(to_email="a@b.com", subject="S", html_body="x") is False
    with patch.object(email_mod.httpx, "post", side_effect=RuntimeError("boom")):
        assert email_mod.send_email(to_email="a@b.com", subject="S", html_body="x") is False


def test_attachments_are_base64(monkeypatch):
    monkeypatch.setattr(settings, "RESEND_API_KEY", "re_test")
    with patch.object(email_mod.httpx, "post", return_value=_resp(200)) as post:
        email_mod.send_email(to_email="a@b.com", subject="S", html_body="x", attachments=[("f.pdf", b"abc", "application/pdf")])
    att = post.call_args.kwargs["json"]["attachments"][0]
    assert att == {"filename": "f.pdf", "content": "YWJj"}
