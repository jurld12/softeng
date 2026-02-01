"""
Generate QR codes for WiFi connection and frontend access
Run: python generate-qr.py
"""
import qrcode
import socket
import subprocess
import re

def get_local_ip():
    """Get the laptop's local IP address"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Doesn't need to be reachable
        s.connect(('10.255.255.255', 1))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

def get_hotspot_ssid():
    """Get the Windows Mobile Hotspot SSID"""
    try:
        # Try to get hosted network (mobile hotspot) SSID
        result = subprocess.run(
            ['netsh', 'wlan', 'show', 'hostednetwork'],
            capture_output=True,
            text=True,
            encoding='utf-8'
        )
        
        # Look for SSID in the output
        for line in result.stdout.split('\n'):
            if 'SSID name' in line:
                # Extract SSID - format: "SSID name : "YourSSID""
                parts = line.split(':', 1)
                if len(parts) > 1:
                    ssid = parts[1].strip().strip('"').strip()
                    if ssid and ssid.lower() not in ['not configured', '']:
                        print(f"✅ Found Mobile Hotspot SSID")
                        return ssid
        
        print("ℹ️  Mobile Hotspot not configured or not started")
        print("   (Go to Settings → Mobile hotspot to enable it)")
        
        # If hosted network doesn't work, try current WiFi connection
        print("ℹ️  Checking current WiFi connection...")
        result = subprocess.run(
            ['netsh', 'wlan', 'show', 'interfaces'],
            capture_output=True,
            text=True,
            encoding='utf-8'
        )
        
        for line in result.stdout.split('\n'):
            if 'SSID' in line and 'BSSID' not in line:
                parts = line.split(':', 1)
                if len(parts) > 1:
                    ssid = parts[1].strip()
                    if ssid:
                        print(f"✅ Found current WiFi SSID")
                        return ssid
                    
    except Exception as e:
        print(f"⚠️  Could not auto-detect SSID: {e}")
    
    print("⚠️  Could not auto-detect any SSID")
    return None

def generate_wifi_qr(ssid, password, security="WPA"):
    """
    Generate WiFi QR code
    Security types: WPA, WEP, or nopass (for open networks)
    """
    wifi_config = f"WIFI:T:{security};S:{ssid};P:{password};;"
    
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(wifi_config)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    img.save("wifi_qr.png")
    print(f"✅ WiFi QR code saved as 'wifi_qr.png'")
    print(f"   SSID: {ssid}")
    print(f"   Scan this to connect to your hotspot")

def generate_url_qr(ip_address, port=3000):
    """Generate URL QR code for frontend access"""
    url = f"http://{ip_address}:{port}/login.html"
    
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    img.save("frontend_qr.png")
    print(f"\n✅ Frontend QR code saved as 'frontend_qr.png'")
    print(f"   URL: {url}")
    print(f"   Scan this after connecting to WiFi to access Healio")

def main():
    print("=" * 50)
    print("  HEALIO - QR Code Generator")
    print("=" * 50)
    
    # Get local IP
    ip = get_local_ip()
    print(f"\n📡 Your laptop's IP: {ip}")
    
    # WiFi hotspot settings (hardcoded)
    print("\n" + "=" * 50)
    print("STEP 1: WiFi Hotspot QR Code")
    print("=" * 50)
    
    ssid = "LAPTOP-EVGFGOQO 2739"
    password = "7i[0P650"
    
    print(f"📡 Using SSID: {ssid}")
    generate_wifi_qr(ssid, password)
    
    # Frontend URL (auto-detected IP)
    print("\n" + "=" * 50)
    print("STEP 2: Frontend Access QR Code")
    print("=" * 50)
    use_auto_ip = input(f"Use detected IP ({ip})? [Y/n]: ").strip().lower()
    
    if use_auto_ip == 'n':
        ip = input("Enter IP address: ").strip()
    
    port_input = input("Enter frontend port [3000]: ").strip()
    port = int(port_input) if port_input else 3000
    
    generate_url_qr(ip, port)
    
    print("\n" + "=" * 50)
    print("✅ QR Codes Generated!")
    print("=" * 50)
    print("\nInstructions:")
    print("1. Scan 'wifi_qr.png' to connect to hotspot")
    print("2. Scan 'frontend_qr.png' to open Healio app")
    print("3. Both QR codes are saved in the current directory")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Cancelled by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
