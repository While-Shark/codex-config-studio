use serde::{Deserialize, Serialize};
use std::{
    fs::{self, File},
    io::Write,
    path::{Path, PathBuf},
    sync::{atomic::{AtomicU64, Ordering}, Mutex, MutexGuard},
    time::{SystemTime, UNIX_EPOCH},
};
use toml_edit::{value, DocumentMut, Item};

static CONFIG_WRITE_LOCK: Mutex<()> = Mutex::new(());
static HISTORY_SEQ: AtomicU64 = AtomicU64::new(0);

#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase")]
struct ManagedConfig {
    model: Option<String>,
    model_reasoning_effort: Option<String>,
    plan_mode_reasoning_effort: Option<String>,
    agents_enabled: Option<bool>,
    default_subagent_model: Option<String>,
    default_subagent_reasoning_effort: Option<String>,
    max_concurrent_threads_per_session: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ScopeRequest {
    kind: String,
    project_path: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ConfigSnapshot {
    path: String,
    exists: bool,
    values: ManagedConfig,
    original_backup_exists: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct HistoryEntry {
    id: String,
    timestamp_ms: u64,
    action: String,
    source: Option<String>,
    scope_kind: String,
    project_path: Option<String>,
    config_path: String,
    values: ManagedConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct HistoryStore {
    entries: Vec<HistoryEntry>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct HistoryRestoreResult {
    scope: ScopeRequest,
    snapshot: ConfigSnapshot,
}

fn file_lock() -> Result<MutexGuard<'static, ()>, String> {
    CONFIG_WRITE_LOCK
        .lock()
        .map_err(|_| "配置写入锁已损坏，请重启 Codex Config Studio 后重试".to_string())
}

fn now_millis() -> Result<u64, String> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .map_err(|e| format!("读取系统时间失败: {e}"))
}

fn global_config_path() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or_else(|| "无法确定当前用户主目录".to_string())?;
    Ok(home.join(".codex").join("config.toml"))
}

fn studio_root() -> Result<PathBuf, String> {
    let global = global_config_path()?;
    global
        .parent()
        .map(Path::to_path_buf)
        .ok_or_else(|| "无法确定 ~/.codex 目录".to_string())
}

fn history_file_path() -> Result<PathBuf, String> {
    Ok(studio_root()?.join(".config-studio").join("history.json"))
}

fn resolve_scope(scope: &ScopeRequest) -> Result<PathBuf, String> {
    match scope.kind.as_str() {
        "global" => global_config_path(),
        "project" => {
            let raw = scope
                .project_path
                .as_deref()
                .ok_or_else(|| "请先选择项目目录".to_string())?;
            let root = PathBuf::from(raw);
            if !root.exists() || !root.is_dir() {
                return Err("项目目录不存在或不是目录".to_string());
            }
            let canonical = root
                .canonicalize()
                .map_err(|e| format!("无法读取项目目录: {e}"))?;
            Ok(canonical.join(".codex").join("config.toml"))
        }
        _ => Err("未知配置作用域".to_string()),
    }
}

fn stable_path_hash(path: &Path) -> String {
    let mut hash: u64 = 0xcbf29ce484222325;
    for byte in path.to_string_lossy().as_bytes() {
        hash ^= *byte as u64;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    format!("{hash:016x}")
}

fn backup_dir(config_path: &Path) -> Result<PathBuf, String> {
    Ok(studio_root()?
        .join(".config-studio-backups")
        .join(stable_path_hash(config_path)))
}

fn ensure_parent(path: &Path) -> Result<(), String> {
    let parent = path
        .parent()
        .ok_or_else(|| "目标路径没有父目录".to_string())?;
    fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {e}"))
}

fn original_state_exists(config_path: &Path) -> Result<bool, String> {
    let dir = backup_dir(config_path)?;
    Ok(dir.join("config.original.toml").exists() || dir.join("config.original.absent").exists())
}

fn ensure_original_backup(config_path: &Path) -> Result<(), String> {
    let dir = backup_dir(config_path)?;
    fs::create_dir_all(&dir).map_err(|e| format!("创建备份目录失败: {e}"))?;
    let original = dir.join("config.original.toml");
    let absent = dir.join("config.original.absent");
    if original.exists() || absent.exists() {
        return Ok(());
    }
    if config_path.exists() {
        fs::copy(config_path, &original).map_err(|e| format!("创建原始配置备份失败: {e}"))?;
    } else {
        fs::write(
            absent,
            b"config.toml did not exist before Codex Config Studio touched this scope\n",
        )
        .map_err(|e| format!("记录原始空状态失败: {e}"))?;
    }
    Ok(())
}

fn history_backup(config_path: &Path) -> Result<(), String> {
    if !config_path.exists() {
        return Ok(());
    }
    let dir = backup_dir(config_path)?.join("history");
    fs::create_dir_all(&dir).map_err(|e| format!("创建历史备份目录失败: {e}"))?;
    let stamp = now_millis()?;
    let target = dir.join(format!("config.{stamp}.toml"));
    fs::copy(config_path, target).map_err(|e| format!("创建历史备份失败: {e}"))?;
    Ok(())
}

fn read_document(config_path: &Path) -> Result<DocumentMut, String> {
    if !config_path.exists() {
        return Ok(DocumentMut::new());
    }
    let text = fs::read_to_string(config_path).map_err(|e| format!("读取配置失败: {e}"))?;
    if text.trim().is_empty() {
        return Ok(DocumentMut::new());
    }
    text.parse::<DocumentMut>()
        .map_err(|e| format!("config.toml 解析失败: {e}"))
}

fn read_values(doc: &DocumentMut) -> ManagedConfig {
    let root_string = |key: &str| doc.get(key).and_then(Item::as_str).map(ToOwned::to_owned);
    let agents = doc.get("agents").and_then(Item::as_table);
    ManagedConfig {
        model: root_string("model"),
        model_reasoning_effort: root_string("model_reasoning_effort"),
        plan_mode_reasoning_effort: root_string("plan_mode_reasoning_effort"),
        agents_enabled: agents.and_then(|t| t.get("enabled")).and_then(Item::as_bool),
        default_subagent_model: agents
            .and_then(|t| t.get("default_subagent_model"))
            .and_then(Item::as_str)
            .map(ToOwned::to_owned),
        default_subagent_reasoning_effort: agents
            .and_then(|t| t.get("default_subagent_reasoning_effort"))
            .and_then(Item::as_str)
            .map(ToOwned::to_owned),
        max_concurrent_threads_per_session: agents
            .and_then(|t| t.get("max_concurrent_threads_per_session"))
            .and_then(Item::as_integer),
    }
}

fn set_root_string(doc: &mut DocumentMut, key: &str, val: &Option<String>) {
    match val {
        Some(v) if !v.trim().is_empty() => doc[key] = value(v.trim()),
        _ => {
            doc.remove(key);
        }
    }
}

fn ensure_agents_table(doc: &mut DocumentMut) {
    if !doc["agents"].is_table() {
        doc["agents"] = Item::Table(toml_edit::Table::new());
    }
}

fn remove_agent_key(doc: &mut DocumentMut, key: &str) {
    if let Some(table) = doc.get_mut("agents").and_then(Item::as_table_mut) {
        table.remove(key);
    }
}

fn cleanup_agents_table(doc: &mut DocumentMut) {
    let should_remove = doc
        .get("agents")
        .and_then(Item::as_table)
        .map(|t| t.is_empty())
        .unwrap_or(false);
    if should_remove {
        doc.remove("agents");
    }
}

fn apply_values_to_doc(doc: &mut DocumentMut, values: &ManagedConfig) {
    set_root_string(doc, "model", &values.model);
    set_root_string(doc, "model_reasoning_effort", &values.model_reasoning_effort);
    set_root_string(doc, "plan_mode_reasoning_effort", &values.plan_mode_reasoning_effort);

    if let Some(enabled) = values.agents_enabled {
        ensure_agents_table(doc);
        doc["agents"]["enabled"] = value(enabled);
    } else {
        remove_agent_key(doc, "enabled");
    }

    if let Some(model) = values.default_subagent_model.as_ref().filter(|v| !v.trim().is_empty()) {
        ensure_agents_table(doc);
        doc["agents"]["default_subagent_model"] = value(model.trim());
    } else {
        remove_agent_key(doc, "default_subagent_model");
    }

    if let Some(reasoning) = values
        .default_subagent_reasoning_effort
        .as_ref()
        .filter(|v| !v.trim().is_empty())
    {
        ensure_agents_table(doc);
        doc["agents"]["default_subagent_reasoning_effort"] = value(reasoning.trim());
    } else {
        remove_agent_key(doc, "default_subagent_reasoning_effort");
    }

    if let Some(count) = values.max_concurrent_threads_per_session {
        ensure_agents_table(doc);
        doc["agents"]["max_concurrent_threads_per_session"] = value(count.clamp(1, 16));
    } else {
        remove_agent_key(doc, "max_concurrent_threads_per_session");
    }
    cleanup_agents_table(doc);
}

fn write_bytes_safely(path: &Path, bytes: &[u8]) -> Result<(), String> {
    ensure_parent(path)?;
    let parent = path.parent().ok_or_else(|| "目标路径没有父目录".to_string())?;
    let name = path.file_name().and_then(|v| v.to_str()).unwrap_or("config");
    let stamp = now_millis()?;
    let tmp = parent.join(format!(".{name}.config-studio-{}-{stamp}.tmp", std::process::id()));

    let mut file = File::create(&tmp).map_err(|e| format!("创建临时文件失败: {e}"))?;
    file.write_all(bytes).map_err(|e| format!("写入临时文件失败: {e}"))?;
    file.sync_all().map_err(|e| format!("同步临时文件失败: {e}"))?;
    drop(file);

    match fs::rename(&tmp, path) {
        Ok(()) => Ok(()),
        Err(first) => {
            if path.exists() {
                fs::remove_file(path).map_err(|e| format!("替换旧配置失败: {e}; 初始错误: {first}"))?;
                fs::rename(&tmp, path).map_err(|e| format!("提交新配置失败: {e}"))?;
                Ok(())
            } else {
                let _ = fs::remove_file(&tmp);
                Err(format!("提交新配置失败: {first}"))
            }
        }
    }
}

fn write_document(config_path: &Path, doc: &DocumentMut) -> Result<(), String> {
    if doc.as_table().is_empty() {
        if config_path.exists() {
            fs::remove_file(config_path).map_err(|e| format!("删除空配置失败: {e}"))?;
        }
        return Ok(());
    }
    write_bytes_safely(config_path, doc.to_string().as_bytes())
}

fn snapshot_for_path(config_path: &Path) -> Result<ConfigSnapshot, String> {
    let exists = config_path.exists();
    let doc = read_document(config_path)?;
    Ok(ConfigSnapshot {
        path: config_path.to_string_lossy().to_string(),
        exists,
        values: read_values(&doc),
        original_backup_exists: original_state_exists(config_path)?,
    })
}

fn read_history_store() -> Result<HistoryStore, String> {
    let path = history_file_path()?;
    if !path.exists() {
        return Ok(HistoryStore::default());
    }
    let text = fs::read_to_string(&path).map_err(|e| format!("读取历史记录失败: {e}"))?;
    if text.trim().is_empty() {
        return Ok(HistoryStore::default());
    }
    match serde_json::from_str::<HistoryStore>(&text) {
        Ok(store) => Ok(store),
        Err(error) => {
            let stamp = now_millis().unwrap_or_default();
            let corrupt = path.with_extension(format!("corrupt.{stamp}.json"));
            let _ = fs::rename(&path, corrupt);
            eprintln!("history.json was invalid and has been quarantined: {error}");
            Ok(HistoryStore::default())
        }
    }
}

fn write_history_store(store: &HistoryStore) -> Result<(), String> {
    let path = history_file_path()?;
    let bytes = serde_json::to_vec_pretty(store).map_err(|e| format!("序列化历史记录失败: {e}"))?;
    write_bytes_safely(&path, &bytes)
}

fn record_history(
    scope: &ScopeRequest,
    config_path: &Path,
    values: &ManagedConfig,
    action: &str,
    source: Option<String>,
) -> Result<(), String> {
    let mut store = read_history_store()?;
    let config_path_text = config_path.to_string_lossy().to_string();
    if let Some(last) = store.entries.first() {
        if last.config_path == config_path_text
            && last.values == *values
            && last.action == action
        {
            return Ok(());
        }
    }
    let timestamp_ms = now_millis()?;
    let seq = HISTORY_SEQ.fetch_add(1, Ordering::Relaxed);
    let id = format!("{timestamp_ms}-{}-{seq}", stable_path_hash(config_path));
    store.entries.insert(
        0,
        HistoryEntry {
            id,
            timestamp_ms,
            action: action.to_string(),
            source,
            scope_kind: scope.kind.clone(),
            project_path: scope.project_path.clone(),
            config_path: config_path_text,
            values: values.clone(),
        },
    );
    store.entries.truncate(300);
    write_history_store(&store)
}

fn apply_config_inner(
    scope: ScopeRequest,
    values: ManagedConfig,
    source: Option<String>,
) -> Result<ConfigSnapshot, String> {
    let _guard = file_lock()?;
    let path = resolve_scope(&scope)?;
    ensure_parent(&path)?;
    ensure_original_backup(&path)?;
    history_backup(&path)?;
    let mut doc = read_document(&path)?;
    apply_values_to_doc(&mut doc, &values);
    write_document(&path, &doc)?;
    let snapshot = snapshot_for_path(&path)?;
    record_history(&scope, &path, &snapshot.values, "apply", source)?;
    Ok(snapshot)
}

fn clear_managed_inner(scope: ScopeRequest) -> Result<ConfigSnapshot, String> {
    let _guard = file_lock()?;
    let path = resolve_scope(&scope)?;
    ensure_parent(&path)?;
    ensure_original_backup(&path)?;
    history_backup(&path)?;
    let mut doc = read_document(&path)?;
    apply_values_to_doc(&mut doc, &ManagedConfig::default());
    write_document(&path, &doc)?;
    let snapshot = snapshot_for_path(&path)?;
    record_history(&scope, &path, &snapshot.values, "clear", Some("clear".to_string()))?;
    Ok(snapshot)
}

fn restore_original_inner(scope: ScopeRequest) -> Result<ConfigSnapshot, String> {
    let _guard = file_lock()?;
    let path = resolve_scope(&scope)?;
    let dir = backup_dir(&path)?;
    let original = dir.join("config.original.toml");
    let absent = dir.join("config.original.absent");
    if !original.exists() && !absent.exists() {
        return Err("这个作用域还没有原始备份。请先应用一次配置后再使用此功能。".to_string());
    }
    ensure_parent(&path)?;
    history_backup(&path)?;
    if original.exists() {
        let bytes = fs::read(&original).map_err(|e| format!("读取原始配置失败: {e}"))?;
        write_bytes_safely(&path, &bytes)?;
    } else if path.exists() {
        fs::remove_file(&path).map_err(|e| format!("恢复原始空状态失败: {e}"))?;
    }
    let snapshot = snapshot_for_path(&path)?;
    record_history(
        &scope,
        &path,
        &snapshot.values,
        "restore_original",
        Some("restore_original".to_string()),
    )?;
    Ok(snapshot)
}

#[tauri::command]
async fn read_config(scope: ScopeRequest) -> Result<ConfigSnapshot, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let _guard = file_lock()?;
        let path = resolve_scope(&scope)?;
        snapshot_for_path(&path)
    })
    .await
    .map_err(|e| format!("读取任务异常终止: {e}"))?
}

#[tauri::command]
async fn apply_config(
    scope: ScopeRequest,
    values: ManagedConfig,
    source: Option<String>,
) -> Result<ConfigSnapshot, String> {
    tauri::async_runtime::spawn_blocking(move || apply_config_inner(scope, values, source))
        .await
        .map_err(|e| format!("写入任务异常终止: {e}"))?
}

#[tauri::command]
async fn clear_managed_config(scope: ScopeRequest) -> Result<ConfigSnapshot, String> {
    tauri::async_runtime::spawn_blocking(move || clear_managed_inner(scope))
        .await
        .map_err(|e| format!("清理任务异常终止: {e}"))?
}

#[tauri::command]
async fn restore_original(scope: ScopeRequest) -> Result<ConfigSnapshot, String> {
    tauri::async_runtime::spawn_blocking(move || restore_original_inner(scope))
        .await
        .map_err(|e| format!("恢复任务异常终止: {e}"))?
}

#[tauri::command]
async fn list_history(limit: Option<usize>) -> Result<Vec<HistoryEntry>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let _guard = file_lock()?;
        let mut entries = read_history_store()?.entries;
        entries.truncate(limit.unwrap_or(100).clamp(1, 300));
        Ok(entries)
    })
    .await
    .map_err(|e| format!("读取历史记录任务异常终止: {e}"))?
}

#[tauri::command]
async fn restore_history_entry(id: String) -> Result<HistoryRestoreResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let _guard = file_lock()?;
        let store = read_history_store()?;
        let entry = store
            .entries
            .iter()
            .find(|item| item.id == id)
            .cloned()
            .ok_or_else(|| "找不到这条历史记录，可能已被清理".to_string())?;
        let scope = ScopeRequest {
            kind: entry.scope_kind.clone(),
            project_path: entry.project_path.clone(),
        };
        let path = resolve_scope(&scope)?;
        ensure_parent(&path)?;
        ensure_original_backup(&path)?;
        history_backup(&path)?;
        let mut doc = read_document(&path)?;
        apply_values_to_doc(&mut doc, &entry.values);
        write_document(&path, &doc)?;
        let snapshot = snapshot_for_path(&path)?;
        record_history(
            &scope,
            &path,
            &snapshot.values,
            "history_restore",
            Some("history_restore".to_string()),
        )?;
        Ok(HistoryRestoreResult { scope, snapshot })
    })
    .await
    .map_err(|e| format!("恢复历史记录任务异常终止: {e}"))?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            read_config,
            apply_config,
            clear_managed_config,
            restore_original,
            list_history,
            restore_history_entry
        ])
        .run(tauri::generate_context!())
        .expect("error while running Codex Config Studio");
}
