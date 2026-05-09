"""Stripe Radar - blocklist of card fingerprints from cancelled subscriptions.

When a customer cancels their subscription, we take the card fingerprint
of the latest payment method used and append it to a Radar Value List
called "pieta_blocked_post_cancel". The Stripe-side rule (configured in
the Dashboard, see __doc__ at bottom) then refuses any future payment
attempts using a card on that list.

Why fingerprint instead of the PaymentMethod id?
- A `pm_xxx` is per-customer; a different customer using the same card
  gets a different `pm_xxx`. Fingerprint is the stable identifier that
  Stripe assigns to a card across customers.

The list is created on-demand the first time we need to add to it. We
cache the list_id in module state so we don't re-create it.
"""
from __future__ import annotations

import logging
from typing import Optional

import stripe

log = logging.getLogger(__name__)

LIST_ALIAS = "pieta_blocked_post_cancel"

_list_id_cache: Optional[str] = None


def _get_or_create_list() -> Optional[str]:
    """Return the list id (cached). Creates the list on first call.
    Returns None if Stripe is misconfigured or the API call fails - we
    never let Radar problems break the cancellation flow."""
    global _list_id_cache
    if _list_id_cache:
        return _list_id_cache

    try:
        existing = stripe.radar.ValueList.list(alias=LIST_ALIAS, limit=1)
        if existing.data:
            _list_id_cache = existing.data[0].id
            return _list_id_cache

        created = stripe.radar.ValueList.create(
            alias=LIST_ALIAS,
            name="pietas.care - cards from cancelled subscriptions",
            item_type="card_fingerprint",
        )
        _list_id_cache = created.id
        log.info("radar: created value list %s (id=%s)", LIST_ALIAS, created.id)
        return _list_id_cache
    except Exception as exc:  # noqa: BLE001
        log.warning("radar: cannot get/create value list: %s", exc)
        return None


def _latest_card_fingerprint(customer_id: str) -> Optional[str]:
    """Pick the most recently-used card fingerprint for the customer.
    Strategy:
      1. Try the customer's default payment method.
      2. Fall back to the most recent successful PaymentIntent.
    Returns None if nothing card-shaped is available."""
    try:
        cust = stripe.Customer.retrieve(
            customer_id,
            expand=["invoice_settings.default_payment_method"],
        )
        default_pm = (cust.get("invoice_settings") or {}).get("default_payment_method")
        if isinstance(default_pm, dict):
            card = default_pm.get("card")
            if card and card.get("fingerprint"):
                return card["fingerprint"]
    except Exception as exc:  # noqa: BLE001
        log.warning("radar: cannot retrieve customer %s: %s", customer_id, exc)

    # Fallback: scan recent payment intents
    try:
        intents = stripe.PaymentIntent.list(customer=customer_id, limit=10)
        for pi in intents.data:
            charges = stripe.Charge.list(payment_intent=pi.id, limit=1)
            for ch in charges.data:
                pm_details = ch.get("payment_method_details") or {}
                card = pm_details.get("card")
                if card and card.get("fingerprint"):
                    return card["fingerprint"]
    except Exception as exc:  # noqa: BLE001
        log.warning("radar: cannot scan payment intents for %s: %s", customer_id, exc)

    return None


def block_card_post_cancel(customer_id: str) -> bool:
    """Add the customer's last-used card fingerprint to the Radar block
    list. Idempotent - duplicates raise; we swallow that. Returns True
    if a fingerprint was queued (not necessarily written), False otherwise."""
    if not customer_id:
        return False

    fingerprint = _latest_card_fingerprint(customer_id)
    if not fingerprint:
        log.info("radar: no card fingerprint for customer=%s, skipping", customer_id)
        return False

    list_id = _get_or_create_list()
    if not list_id:
        return False

    try:
        stripe.radar.ValueListItem.create(value_list=list_id, value=fingerprint)
        log.info("radar: blocked card fingerprint=%s (customer=%s)", fingerprint, customer_id)
        return True
    except stripe.error.InvalidRequestError as exc:
        # Most common: "Item already exists in the value list."
        msg = str(exc).lower()
        if "already" in msg or "exist" in msg or "duplicate" in msg:
            log.info("radar: fingerprint=%s already in list (no-op)", fingerprint)
            return True
        log.warning("radar: invalid request adding fingerprint=%s: %s", fingerprint, exc)
        return False
    except Exception as exc:  # noqa: BLE001
        log.warning("radar: failed to add fingerprint=%s: %s", fingerprint, exc)
        return False


# ─────────────────────────────────────────────────────────────────────
# Stripe Dashboard rule (manual setup, ONE TIME)
#
#   Settings → Radar → Rules → Add custom rule (Block) →
#
#       Block if :card_fingerprint: in @pieta_blocked_post_cancel
#
# This file populates the list automatically on subscription cancel;
# the rule above is the actual enforcement. Without the rule, the list
# exists but doesn't block anything.
# ─────────────────────────────────────────────────────────────────────
