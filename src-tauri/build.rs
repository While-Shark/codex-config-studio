fn main() {
    println!("cargo:rerun-if-env-changed=CODEX_UPDATER_PUBKEY");
    tauri_build::build()
}
