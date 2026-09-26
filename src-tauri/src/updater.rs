use serde::Serialize;
use tauri::{AppHandle, Runtime};
use tauri_plugin_updater::UpdaterExt;

const PUBKEY: Option<&str> = option_env!("TAURI_UPDATER_PUBKEY");

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SignedUpdaterInfo {
    pub enabled: bool,
    pub current_version: String,
}

pub fn signed_updater_enabled() -> bool {
    PUBKEY.is_some_and(|value| !value.trim().is_empty())
}

pub fn plugin<R: Runtime>() -> tauri::plugin::TauriPlugin<R, tauri_plugin_updater::Config> {
    let builder = tauri_plugin_updater::Builder::new();
    match PUBKEY.filter(|value| !value.trim().is_empty()) {
        Some(pubkey) => builder.pubkey(pubkey).build(),
        None => builder.build(),
    }
}

#[tauri::command]
pub async fn signed_updater_info(app: AppHandle) -> Result<SignedUpdaterInfo, String> {
    Ok(SignedUpdaterInfo {
        enabled: signed_updater_enabled(),
        current_version: app.package_info().version.to_string(),
    })
}

#[tauri::command]
pub async fn install_signed_update(app: AppHandle) -> Result<String, String> {
    if !signed_updater_enabled() {
        return Err("Signed updater is not enabled in this build".to_string());
    }

    let updater = app
        .updater()
        .map_err(|error| format!("Could not initialize signed updater: {error}"))?;
    let Some(update) = updater
        .check()
        .await
        .map_err(|error| format!("Could not check signed update: {error}"))?
    else {
        return Err("No signed update is available".to_string());
    };

    let version = update.version.clone();
    update
        .download_and_install(|_, _| {}, || {})
        .await
        .map_err(|error| format!("Could not install signed update: {error}"))?;

    #[cfg(not(target_os = "windows"))]
    app.restart();

    #[cfg(target_os = "windows")]
    Ok(version)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn unsigned_development_build_reports_updater_disabled() {
        if option_env!("TAURI_UPDATER_PUBKEY").is_none() {
            assert!(!signed_updater_enabled());
        }
    }
}
