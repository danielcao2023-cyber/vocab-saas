#!/usr/bin/env bash
# Build from the explicitly prepared mobile-dist, then sign outside the source tree.
set -euo pipefail
native_dir="$(cd "$(dirname "$0")" && pwd)"
app_dir="$(dirname "$native_dir")"
: "${JAVA_HOME:?Set JAVA_HOME to JDK 21}"
: "${ANDROID_HOME:?Set ANDROID_HOME to an installed Android SDK}"
build_tools_version="${ANDROID_BUILD_TOOLS_VERSION:-35.0.0}"
signing_dir="${XIAOBEI_SIGNING_DIR:-$HOME/.codex/signing/xiaobei-android}"
key_store="$signing_dir/xiaobei-local.p12"
password_file="$signing_dir/store-password"
output_dir="$native_dir/app/build/outputs/apk/release"
output_apk="$output_dir/xiaobei-vocabulary-1.0.0.apk"

if [[ ! -f "$app_dir/mobile-dist/index.html" || ! -f "$app_dir/mobile-dist/offline/seed.db" || ! -f "$app_dir/mobile-dist/offline/sql-wasm.wasm" ]]; then
  echo 'Prepare the audited mobile-dist (including offline/seed.db and offline/sql-wasm.wasm) before building.' >&2
  exit 1
fi
if [[ ! -x "$ANDROID_HOME/build-tools/$build_tools_version/apksigner" ]]; then
  echo "Android build-tools $build_tools_version must already be installed and licensed." >&2
  exit 1
fi

mkdir -p "$signing_dir"
chmod 700 "$signing_dir"
if [[ ! -f "$key_store" ]]; then
  if [[ -e "$password_file" ]]; then
    echo 'Signing password exists without a keystore; inspect the signing directory before retrying.' >&2
    exit 1
  fi
  (umask 077; "$JAVA_HOME/bin/java" -version >/dev/null 2>&1; openssl rand -base64 36 > "$password_file")
  "$JAVA_HOME/bin/keytool" -genkeypair -storetype PKCS12 -keystore "$key_store" \
    -storepass:file "$password_file" -keypass:file "$password_file" \
    -alias xiaobei-local -keyalg RSA -keysize 3072 -validity 10000 \
    -dname 'CN=Xiaobei Local Install, OU=Personal, O=Xiaobei, C=CN'
  chmod 600 "$key_store"
fi
if [[ ! -f "$password_file" ]]; then
  echo 'Signing password file is missing; restore it securely rather than replacing the existing key.' >&2
  exit 1
fi

cd "$app_dir"
npm exec cap sync android
"$native_dir/gradlew" -p "$native_dir" :app:assembleRelease
"$ANDROID_HOME/build-tools/$build_tools_version/zipalign" -f -p 4 \
  "$output_dir/app-release-unsigned.apk" "$output_dir/app-release-aligned.apk"
"$ANDROID_HOME/build-tools/$build_tools_version/apksigner" sign \
  --ks "$key_store" --ks-key-alias xiaobei-local --ks-pass "file:$password_file" \
  --out "$output_apk" "$output_dir/app-release-aligned.apk"
"$ANDROID_HOME/build-tools/$build_tools_version/apksigner" verify --verbose "$output_apk"
"$ANDROID_HOME/build-tools/$build_tools_version/zipalign" -c -p 4 "$output_apk"
shasum -a 256 "$output_apk" > "$output_apk.sha256"
printf 'Signed APK: %s\n' "$output_apk"
