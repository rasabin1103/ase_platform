class EmailDeliveryError(Exception):
    """Raised when the transactional email provider rejects or fails the send."""
