
import requests
import logging

logger = logging.getLogger(__name__)

# Private/loopback IP prefixes - these will never resolve to a location
_PRIVATE_PREFIXES = ("127.", "10.", "172.16.", "172.17.", "172.18.", "172.19.",
                     "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.",
                     "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.",
                     "192.168.", "::1", "fc", "fd")


def get_location_from_ip(ip_address: str) -> str:
    """
    Get location (City, Country) from IP address using ip-api.com
    Free tier: 45 requests per minute
    Returns 'Unknown Location' on any failure — this must never block a login.
    """
    if not ip_address:
        return "Unknown Location"

    # Skip lookup for private/loopback addresses
    if ip_address in ("127.0.0.1", "localhost", "0.0.0.0", "::1"):
        return "Localhost / Private Network"
    if any(ip_address.startswith(prefix) for prefix in _PRIVATE_PREFIXES):
        return "Private Network"

    try:
        # Short timeout (3s) so login is never significantly delayed by this call
        response = requests.get(
            f"http://ip-api.com/json/{ip_address}",
            timeout=3
        )
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                city = data.get("city", "Unknown")
                country = data.get("country", "Unknown")
                return f"{city}, {country}"

        return "Unknown Location"
    except Exception as e:
        logger.warning(f"GeoIP lookup failed for {ip_address}: {str(e)}")
        return "Unknown Location"
