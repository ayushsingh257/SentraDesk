import datetime
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
import os

def generate_self_signed_cert():
    certs_dir = os.path.join(os.path.dirname(__file__), "certs")
    os.makedirs(certs_dir, exist_ok=True)
    
    key_path = os.path.join(certs_dir, "localhost.key")
    cert_path = os.path.join(certs_dir, "localhost.crt")
    
    if os.path.exists(key_path) and os.path.exists(cert_path):
        print("Certificates already exist.")
        return

    # Generate key
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    
    # Generate cert
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, "IN"),
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Delhi"),
        x509.NameAttribute(NameOID.LOCALITY_NAME, "New Delhi"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Cyber Complaint Governance Platform"),
        x509.NameAttribute(NameOID.COMMON_NAME, "localhost"),
    ])
    
    cert = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        issuer
    ).public_key(
        private_key.public_key()
    ).serial_number(
        x509.random_serial_number()
    ).not_valid_before(
        datetime.datetime.now(datetime.timezone.utc)
    ).not_valid_after(
        # 10 years validity
        datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=3650)
    ).add_extension(
        x509.SubjectAlternativeName([x509.DNSName("localhost"), x509.DNSName("127.0.0.1")]),
        critical=False,
    ).sign(private_key, hashes.SHA256())
    
    # Write key
    with open(key_path, "wb") as f:
        f.write(private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption()
        ))
        
    # Write cert
    with open(cert_path, "wb") as f:
        f.write(cert.public_bytes(serialization.Encoding.PEM))
        
    print("Generated self-signed certificates successfully.")

if __name__ == "__main__":
    generate_self_signed_cert()
