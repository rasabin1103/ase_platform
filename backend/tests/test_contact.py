"""Contact form API tests."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.modules.notifications.exceptions import EmailDeliveryError

client = TestClient(app)

VALID_PAYLOAD = {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "company": "Acme Corp",
    "subject": "Platform automation",
    "inquiry_type": "QA automation",
    "message": "We need help automating our regression suite for a multi-tenant SaaS product.",
}


def test_contact_requires_fields():
    res = client.post("/api/v1/contact", json={})
    assert res.status_code == 422


def test_contact_rejects_invalid_email():
    res = client.post(
        "/api/v1/contact",
        json={**VALID_PAYLOAD, "email": "not-an-email"},
    )
    assert res.status_code == 422


def test_contact_rejects_short_message():
    res = client.post(
        "/api/v1/contact",
        json={**VALID_PAYLOAD, "message": "too short"},
    )
    assert res.status_code == 422


@patch("app.modules.contact.service.get_email_provider")
def test_contact_sends_to_inbox_with_reply_to(mock_get_provider):
    provider = MagicMock()
    mock_get_provider.return_value = provider

    with patch("app.modules.contact.service.settings") as mock_settings:
        mock_settings.CONTACT_INBOX_EMAIL = "contact@arcesabinengineering.com"
        mock_settings.EMAIL_FROM = "contact@arcesabinengineering.com"
        res = client.post("/api/v1/contact", json=VALID_PAYLOAD)

    assert res.status_code == 201
    assert res.json()["message"] == "Message sent successfully"
    provider.send_email.assert_called_once()
    kwargs = provider.send_email.call_args.kwargs
    assert kwargs["to"] == "contact@arcesabinengineering.com"
    assert kwargs["reply_to"] == "jane@example.com"
    assert "Nuevo mensaje desde la web de ASE:" in kwargs["subject"]
    assert "Jane Doe" in kwargs["html"]
    assert "Origen: Web ASE" in kwargs["text"]


@patch("app.modules.contact.service.get_email_provider")
def test_contact_provider_error_is_controlled(mock_get_provider):
    provider = MagicMock()
    provider.send_email.side_effect = EmailDeliveryError("fail")
    mock_get_provider.return_value = provider

    res = client.post("/api/v1/contact", json=VALID_PAYLOAD)
    assert res.status_code == 502
    assert res.json()["detail"] == "Could not send message. Please try again later."


@patch("app.modules.contact.router._client_ip", return_value="198.51.100.42")
@patch("app.modules.contact.service.get_email_provider")
def test_contact_rate_limit(mock_get_provider, _mock_ip):
    from app.core.rate_limit import reset_rate_limit

    reset_rate_limit("contact:ip:198.51.100.42")
    provider = MagicMock()
    mock_get_provider.return_value = provider

    for i in range(5):
        res = client.post(
            "/api/v1/contact",
            json={**VALID_PAYLOAD, "email": f"rate{i}@example.com"},
        )
        assert res.status_code == 201

    blocked = client.post(
        "/api/v1/contact",
        json={**VALID_PAYLOAD, "email": "blocked@example.com"},
    )
    assert blocked.status_code == 429
