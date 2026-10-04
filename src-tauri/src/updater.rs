use serde::Serialize;
use tauri::{ipc::Channel, AppHandle, Runtime};
use tauri_plugin_updater::UpdaterExt;

const PUBKEY: Option<&str> = option_env!("CODEX_UPDATER_PUBKEY");

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SignedUpdaterInfo {
    pub enabled: bool,
    pub current_version: String,
}

pub fn signed_updater_enabled() -> bool {
    PUBKEY.is_some_and(|value| !value.trim().is_empty())
}

fn runtime_updater_enabled(app: &AppHandle) -> bool {
    signed_updater_enabled() || app.config().plugins.0.get("updater")
        .and_then(|config| config.get("pubkey"))
        .and_then(serde_json::Value::as_str)
        .is_some_and(|key| !key.trim().is_empty())
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProgress {
    stage: &'static str,
    downloaded: u64,
    total: Option<u64>,
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
        enabled: runtime_updater_enabled(&app),
        current_version: app.package_info().version.to_string(),
    })
}

#[tauri::command]
pub async fn install_signed_update(app: AppHandle, on_event: Channel<UpdateProgress>) -> Result<String, String> {
    if !runtime_updater_enabled(&app) {
        return Err("Signed updater is not enabled in this build".to_string());
    }

    let _ = on_event.send(UpdateProgress { stage: "checking", downloaded: 0, total: None });
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

    #[cfg(target_os = "windows")]
    let version = update.version.clone();

    let mut downloaded = 0_u64;
    update
        .download_and_install(
            |chunk_length, total| {
                downloaded = downloaded.saturating_add(chunk_length as u64);
                let _ = on_event.send(UpdateProgress { stage: "downloading", downloaded, total });
            },
            || {
                let _ = on_event.send(UpdateProgress { stage: "installing", downloaded: 0, total: None });
            },
        )
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
        if option_env!("CODEX_UPDATER_PUBKEY").is_none() {
            assert!(!signed_updater_enabled());
        }
    }
}
