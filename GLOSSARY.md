# Tallyhold

Terms for the portfolio and sign-in concepts that must remain distinct as
the app grows across brokers and login providers.

## Language

**Tallyhold user**:
The investor whose portfolio, preferences and broker accounts belong to
one internal identity.
_Avoid_: Google user, Supabase user

**Supabase Auth user**:
The login identity issued by Supabase Auth for an authenticated session;
it is not itself a Tallyhold portfolio owner.
_Avoid_: Tallyhold user, Google subject

**Identity**:
The association between a verified login identity and a Tallyhold user.
Email and provider name describe a login but do not establish this
association.
_Avoid_: email account, Google subject

**Broker account**:
One investor's account at a broker, distinct from the shared broker name
and from the account used to sign in.
_Avoid_: login account, broker

**Broker**:
A shared reference to a brokerage entity identified by its name and
jurisdiction, not an investor's personal account there.
_Avoid_: broker account, login provider

**Account currency**:
The preferred currency associated with a broker account for entry and
potential account-level reporting; it does not restrict the currencies
of transactions or holdings.
_Avoid_: transaction currency, user base currency
