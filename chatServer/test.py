"""
test_ocr.py — OCR Space detailed diagnostic
Usage:
    python test_ocr.py
    python test_ocr.py --pdf path/to/file.pdf
"""

import os, sys, socket, time, base64, argparse, requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.environ.get("OCR_SPACE_API_KEY", "")
API_URL = "https://api.ocr.space/parse/image"

TINY_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg=="
)

def sep(title=""):
    print(f"\n{'─'*20} {title} {'─'*20}" if title else "="*60)

def ok(m):   print(f"    ✅  {m}")
def fail(m): print(f"    ❌  {m}")
def warn(m): print(f"    ⚠️   {m}")
def info(m): print(f"    ℹ️   {m}")


def check_env():
    sep("1. Environment")
    print(f"    Python  : {sys.version.split()[0]}")
    print(f"    Platform: {sys.platform}")
    if not API_KEY or API_KEY == "key":
        fail("OCR_SPACE_API_KEY not set")
        return False
    ok(f"API key: {API_KEY[:6]}{'*'*(len(API_KEY)-6)}")
    return True


def check_dns():
    sep("2. DNS Resolution")
    results = {}
    for host in ["api.ocr.space", "api2.ocr.space", "google.com"]:
        try:
            ip = socket.gethostbyname(host)
            ok(f"{host} → {ip}")
            results[host] = ip
        except socket.gaierror as e:
            fail(f"{host} → {e}")
            results[host] = None
    return results


def check_tcp(dns):
    sep("3. TCP Connect (port 443)")
    for host, ip in dns.items():
        if host == "google.com": continue
        if not ip:
            warn(f"{host} — skipped (DNS failed)")
            continue
        try:
            start = time.time()
            s = socket.create_connection((host, 443), timeout=10)
            s.close()
            ok(f"{host}:443 → {int((time.time()-start)*1000)}ms")
        except Exception as e:
            fail(f"{host}:443 → {e}")


def check_http():
    sep("4. HTTPS GET")
    for url in ["https://api.ocr.space", "https://ocr.space"]:
        try:
            start = time.time()
            r = requests.get(url, timeout=10)
            ok(f"GET {url} → HTTP {r.status_code} ({int((time.time()-start)*1000)}ms)")
        except requests.Timeout:
            fail(f"GET {url} → Timed out")
        except requests.ConnectionError as e:
            fail(f"GET {url} → {e}")


def check_api_png():
    sep("5. API Call — Tiny PNG (auth test)")
    if not API_KEY or API_KEY == "key":
        warn("Skipped — no API key")
        return False
    try:
        start = time.time()
        r = requests.post(
            API_URL,
            headers={"apikey": API_KEY},
            files={"file": ("test.png", TINY_PNG, "image/png")},
            data={"language": "eng", "OCREngine": "1", "isOverlayRequired": "false"},
            timeout=30,
        )
        elapsed = int((time.time()-start)*1000)
        info(f"HTTP {r.status_code} in {elapsed}ms")
        body = r.json()
        exit_code = body.get("OCRExitCode")
        errored   = body.get("IsErroredOnProcessing", False)
        err_msg   = body.get("ErrorMessage") or ""
        info(f"OCRExitCode: {exit_code} | IsErrored: {errored}")
        if err_msg: warn(f"Message: {err_msg}")
        if exit_code in (1, 2) and not errored:
            ok("API key valid — connection works!")
            return True
        fail(f"Exit code {exit_code}: {err_msg}")
        return False
    except requests.Timeout:
        fail("Timed out")
        return False
    except requests.ConnectionError as e:
        fail(f"Connection error: {e}")
        return False


def check_api_pdf(pdf_path):
    sep(f"6. API Call — PDF: {os.path.basename(pdf_path)}")
    if not os.path.isfile(pdf_path):
        fail(f"File not found: {pdf_path}")
        return
    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()
    info(f"File size: {len(pdf_bytes):,} bytes")
    try:
        start = time.time()
        r = requests.post(
            API_URL,
            headers={"apikey": API_KEY},
            files={"file": (os.path.basename(pdf_path), pdf_bytes, "application/pdf")},
            data={"language": "eng", "OCREngine": "3", "isTable": "true",
                  "scale": "true", "detectOrientation": "true", "isOverlayRequired": "false"},
            timeout=120,
        )
        elapsed = int((time.time()-start)*1000)
        info(f"HTTP {r.status_code} in {elapsed}ms")
        body    = r.json()
        results = body.get("ParsedResults") or []
        info(f"Pages parsed: {len(results)}")
        for i, page in enumerate(results, 1):
            text = (page.get("ParsedText") or "").strip()
            info(f"Page {i}: {len(text)} chars")
            if text:
                print(f"\n    Preview:\n    {text[:300].replace(chr(10), chr(10)+'    ')}\n")
        if results and body.get("OCRExitCode") in (1, 2):
            ok("PDF processed!")
        else:
            fail(f"Failed: {body.get('ErrorMessage') or 'unknown'}")
    except requests.Timeout:
        fail("Timed out")
    except Exception as e:
        fail(f"{type(e).__name__}: {e}")


def check_all_engines(pdf_path):
    sep(f"7. Engine Comparison — {os.path.basename(pdf_path)}")
    if not os.path.isfile(pdf_path):
        fail(f"File not found: {pdf_path}")
        return
    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()

    for engine in [1, 2, 3]:
        print(f"\n    --- Engine {engine} ---")
        try:
            start = time.time()
            r = requests.post(
                API_URL,
                headers={"apikey": API_KEY},
                files={"file": (os.path.basename(pdf_path), pdf_bytes, "application/pdf")},
                data={"language": "eng", "OCREngine": str(engine), "isTable": "true",
                      "scale": "true", "detectOrientation": "true", "isOverlayRequired": "false"},
                timeout=120,
            )
            elapsed = int((time.time()-start)*1000)
            body    = r.json()
            results = body.get("ParsedResults") or []
            text    = (results[0].get("ParsedText") or "").strip() if results else ""
            info(f"HTTP {r.status_code} | {elapsed}ms | {len(text)} chars extracted")
            if text:
                preview = text[:300].replace("\n", "\n    ")
                print(f"    Preview: {preview}")
            else:
                warn(f"Engine {engine}: no text extracted")
        except requests.Timeout:
            fail(f"Engine {engine}: timed out")
        except Exception as e:
            fail(f"Engine {engine}: {type(e).__name__}: {e}")


# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", default=None)
    args = parser.parse_args()

    sep()
    print("      OCR SPACE — DETAILED DIAGNOSTIC TEST")
    sep()

    key_ok = check_env()
    dns    = check_dns()
    check_tcp(dns)
    check_http()

    api_ok = check_api_png() if key_ok else False

    if args.pdf and key_ok and api_ok:
        check_api_pdf(args.pdf)
        check_all_engines(args.pdf)
    elif args.pdf:
        warn("Skipping PDF test — basic API test failed")

    sep()
    print("Done.")
    sep()