"""Account-module failures that do not expose persistence details."""


class AccountNotFound(Exception):
    """The account is absent from the caller's ownership scope."""


class BrokerNotFound(Exception):
    """The requested shared broker is absent."""


class DuplicateAccountName(Exception):
    """The owner already has an account with this name."""


class AccountInUse(Exception):
    """Transactions still reference the account."""


class BrokerIntegrityError(Exception):
    """An existing account references a missing shared broker."""
