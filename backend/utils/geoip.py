
import requests
import logging

logger = logging.getLogger(__name__)

def get_location_from_ip(ip_address: str) -> str:
    """
    Get location (City, Country) from IP address using ip-api.com
    Free tier: 45 requests per minute
    """
    if not ip_address or ip_address == "127.0.0.1" or ip_address == "localhost" or ip_address.startswith("192.168."):
        return "Localhost / Private Network"
        
    try:
        # Using ip-api.com (no key required for non-commercial use)
        response = requests.get(f"http://ip-api.com/json/{ip_address}", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                city = data.get("city", "Unknown")
                country = data.get("country", "Unknown")
                return f"{city}, {country}"
                
        return "Unknown Location"
    except Exception as e:
        logger.error(f"GeoIP error for {ip_address}: {str(e)}")
        return "Unknown Location"
