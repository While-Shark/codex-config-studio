mod usage;

use serde::{Deserialize, Serialize};
use std::{
    any::Any,
    fs::{self, File},
    io::Write,
    panic::{catch_unwind, AssertUnwindSafe},
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicU64, Ordering},
        Mutex, MutexGuard,
    },
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

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ConfigInspection {
    scope_kind: String,
    project_path: Option<String>,
    path: String,
    exists: bool,
    valid_toml: bool,
    key_paths: Vec<Vec<String>>,
    managed_field_count: usize,
    parse_error: Option<String>,
}

fn recoverable_file_lock() -> MutexGuard<'static, ()> {
    match CONFIG_WRITE_LOCK.lock() {
        Ok(guard) => guard,
        Err(poisoned) => {
            eprintln!("configuration lock was poisoned by a previous panic; recovering safely");
            poisoned.into_inner()
        }
    }
}

fn panic_message(payload: Box<dyn Any + Send>) -> String {
    if let Some(message) = payload.downcast_ref::<&str>() {
        (*message).to_string()
    } else if let Some(message) = payload.downcast_ref::<String>() {
        message.clone()
    } else {
        "未知内部异常".to_string()
    }
}

fn with_config_lock<T>(
    operation: &str,
    task: impl FnOnce() -> Result<T, String>,
) -> Result<T, String> {
    // Keep the guard outside catch_unwind. If a native operation panics, the panic is
    // caught before the guard is dropped, so the mutex itself is not poisoned.
    // If an older code path already poisoned the mutex, recover the inner guard and
    // continue instead of permanently bricking all subsequent reads/writes.
    let _guard = recoverable_file_lock();
    match catch_unwind(AssertUnwindSafe(task)) {
        Ok(result) => result,
        Err(payload) => {
            let detail = panic_message(payload);
            eprintln!("{operation} panicked and was safely aborted: {detail}");
            Err(format!(
                "{operation}发生内部异常，操作已安全中止。请重试；如果持续发生，请提交日志。详情: {detail}"
            ))
        }
    }
}

fn now_millis() -> Result<u64, String> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .map_err(|e| format!("读取系统时间失败: {e}"))
}

#[cfg(test)]
thread_local! {
    static TEST_CONFIG_HOME: std::cell::RefCell<Option<PathBuf>> = const {
        std::cell::RefCell::new(None)
    };
}

fn global_config_path() -> Result<PathBuf, String> {
    #[cfg(test)]
    if let Some(home) = TEST_CONFIG_HOME.with(|cell| cell.borrow().clone()) {
        return Ok(home.join(".codex").join("config.toml"));
    }
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

fn collect_key_paths_from_table(
    table: &dyn toml_edit::TableLike,
    prefix: &mut Vec<String>,
    output: &mut Vec<Vec<String>>,
) {
    for (key, item) in table.iter() {
        prefix.push(key.to_string());
        output.push(prefix.clone());

        if let Some(child) = item.as_table_like() {
            collect_key_paths_from_table(child, prefix, output);
        } else if let Some(array) = item.as_array_of_tables() {
            for child in array.iter() {
                collect_key_paths_from_table(child, prefix, output);
            }
        }
        prefix.pop();
    }
}

fn collect_key_paths(doc: &DocumentMut) -> Vec<Vec<String>> {
    let mut output = Vec::new();
    let mut prefix = Vec::new();
    collect_key_paths_from_table(doc.as_table(), &mut prefix, &mut output);
    output.sort();
    output.dedup();
    output
}

fn managed_field_count(values: &ManagedConfig) -> usize {
    [
        values.model.is_some(),
        values.model_reasoning_effort.is_some(),
        values.plan_mode_reasoning_effort.is_some(),
        values.agents_enabled.is_some(),
        values.default_subagent_model.is_some(),
        values.default_subagent_reasoning_effort.is_some(),
        values.max_concurrent_threads_per_session.is_some(),
    ]
    .into_iter()
    .filter(|value| *value)
    .count()
}

fn inspect_config_inner(scope: ScopeRequest) -> Result<ConfigInspection, String> {
    let path = resolve_scope(&scope)?;
    if !path.exists() {
        return Ok(ConfigInspection {
            scope_kind: scope.kind,
            project_path: scope.project_path,
            path: path.to_string_lossy().to_string(),
            exists: false,
            valid_toml: true,
            key_paths: Vec::new(),
            managed_field_count: 0,
            parse_error: None,
        });
    }

    let text = fs::read_to_string(&path).map_err(|e| format!("读取配置失败: {e}"))?;
    if text.trim().is_empty() {
        return Ok(ConfigInspection {
            scope_kind: scope.kind,
            project_path: scope.project_path,
            path: path.to_string_lossy().to_string(),
            exists: true,
            valid_toml: true,
            key_paths: Vec::new(),
            managed_field_count: 0,
            parse_error: None,
        });
    }

    match text.parse::<DocumentMut>() {
        Ok(doc) => {
            let values = read_values(&doc);
            Ok(ConfigInspection {
                scope_kind: scope.kind,
                project_path: scope.project_path,
                path: path.to_string_lossy().to_string(),
                exists: true,
                valid_toml: true,
                key_paths: collect_key_paths(&doc),
                managed_field_count: managed_field_count(&values),
                parse_error: None,
            })
        }
        Err(error) => Ok(ConfigInspection {
            scope_kind: scope.kind,
            project_path: scope.project_path,
            path: path.to_string_lossy().to_string(),
            exists: true,
            valid_toml: false,
            key_paths: Vec::new(),
            managed_field_count: 0,
            parse_error: Some(error.to_string()),
        }),
    }
}

fn is_managed_key_path(path: &[String]) -> bool {
    matches!(
        path,
        [root]
            if matches!(
                root.as_str(),
                "model" | "model_reasoning_effort" | "plan_mode_reasoning_effort"
            )
    ) || matches!(
        path,
        [agents, key]
            if agents == "agents"
                && matches!(
                    key.as_str(),
                    "enabled"
                        | "default_subagent_model"
                        | "default_subagent_reasoning_effort"
                        | "max_concurrent_threads_per_session"
                )
    )
}

fn remove_table_path(table: &mut dyn toml_edit::TableLike, path: &[String]) -> Result<bool, String> {
    if path.is_empty() {
        return Err("配置键路径不能为空".into());
    }
    if path.len() == 1 {
        return Ok(table.remove(&path[0]).is_some());
    }
    let Some(item) = table.get_mut(&path[0]) else {
        return Ok(false);
    };
    let Some(child) = item.as_table_like_mut() else {
        return Err(format!("无法进入配置表 '{}'", path[0]));
    };
    remove_table_path(child, &path[1..])
}

fn remove_config_key_inner(scope: ScopeRequest, key_path: Vec<String>) -> Result<ConfigSnapshot, String> {
    if key_path.is_empty()
        || key_path.len() > 16
        || key_path.iter().any(|part| part.is_empty() || part.len() > 256)
        || key_path.iter().map(String::len).sum::<usize>() > 1024
    {
        return Err("配置键路径无效".into());
    }
    if is_managed_key_path(&key_path) {
        return Err("受管字段请在高级配置中修改，健康检查不会直接删除".into());
    }

    let path = resolve_scope(&scope)?;
    let mut doc = read_document(&path)?;
    if !remove_table_path(doc.as_table_mut(), &key_path)? {
        return snapshot_for_path(&path);
    }

    ensure_original_backup(&path)?;
    history_backup(&path)?;
    write_document(&path, &doc)?;
    let snapshot = snapshot_for_path(&path)?;
    record_history(
        &scope,
        &path,
        &snapshot.values,
        "health_remove",
        Some(format!("health_remove:{}", key_path.join("."))),
    )?;
    Ok(snapshot)
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
    let agents = doc.get("agents").and_then(Item::as_table_like);
    ManagedConfig {
        model: root_string("model"),
        model_reasoning_effort: root_string("model_reasoning_effort"),
        plan_mode_reasoning_effort: root_string("plan_mode_reasoning_effort"),
        agents_enabled: agents
            .and_then(|t| t.get("enabled"))
            .and_then(Item::as_bool),
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
        Some(v) if !v.trim().is_empty() => {
            let mut replacement = value(v.trim());
            if let Some(existing) = doc.get_mut(key) {
                // Mutate the value, not the table key: retain comments and spacing.
                if let (Some(old), Some(new)) = (existing.as_value(), replacement.as_value_mut()) {
                    *new.decor_mut() = old.decor().clone();
                }
                *existing = replacement;
            } else {
                doc.as_table_mut().insert(key, replacement);
            }
        }
        _ => {
            doc.remove(key);
        }
    }
}

fn validate_agents_shape(doc: &DocumentMut) -> Result<(), String> {
    match doc.get("agents") {
        None => Ok(()),
        Some(item) if item.is_none() || item.as_table_like().is_some() => Ok(()),
        Some(_) => Err("config.toml: 'agents' must be a table ([agents] or agents = {...}); existing value was left unchanged".into()),
    }
}

fn ensure_agents_table(doc: &mut DocumentMut) -> Result<&mut dyn toml_edit::TableLike, String> {
    validate_agents_shape(doc)?;
    // A read via doc["agents"] panics when the key is missing.
    if doc.get("agents").is_none_or(Item::is_none) {
        doc.as_table_mut()
            .insert("agents", Item::Table(toml_edit::Table::new()));
    }
    doc.get_mut("agents")
        .and_then(Item::as_table_like_mut)
        .ok_or_else(|| "Unable to access the agents table".to_string())
}

fn remove_agent_key(doc: &mut DocumentMut, key: &str) {
    if let Some(table) = doc.get_mut("agents").and_then(Item::as_table_like_mut) {
        table.remove(key);
    }
}

fn cleanup_agents_table(doc: &mut DocumentMut) {
    let should_remove = doc
        .get("agents")
        .and_then(Item::as_table_like)
        .map(|table| table.is_empty())
        .unwrap_or(false);
    if should_remove {
        doc.remove("agents");
    }
}

fn apply_values_to_doc(doc: &mut DocumentMut, values: &ManagedConfig) -> Result<(), String> {
    // Validate incompatible shapes before changing any field.
    validate_agents_shape(doc)?;
    if let Some(count) = values.max_concurrent_threads_per_session {
        if !(1..=16).contains(&count) {
            return Err("max_concurrent_threads_per_session must be between 1 and 16".into());
        }
    }
    set_root_string(doc, "model", &values.model);
    set_root_string(
        doc,
        "model_reasoning_effort",
        &values.model_reasoning_effort,
    );
    set_root_string(
        doc,
        "plan_mode_reasoning_effort",
        &values.plan_mode_reasoning_effort,
    );

    if let Some(enabled) = values.agents_enabled {
        ensure_agents_table(doc)?.insert("enabled", value(enabled));
    } else {
        remove_agent_key(doc, "enabled");
    }
    if let Some(model) = values
        .default_subagent_model
        .as_ref()
        .filter(|v| !v.trim().is_empty())
    {
        ensure_agents_table(doc)?.insert("default_subagent_model", value(model.trim()));
    } else {
        remove_agent_key(doc, "default_subagent_model");
    }
    if let Some(reasoning) = values
        .default_subagent_reasoning_effort
        .as_ref()
        .filter(|v| !v.trim().is_empty())
    {
        ensure_agents_table(doc)?
            .insert("default_subagent_reasoning_effort", value(reasoning.trim()));
    } else {
        remove_agent_key(doc, "default_subagent_reasoning_effort");
    }
    if let Some(count) = values.max_concurrent_threads_per_session {
        ensure_agents_table(doc)?.insert("max_concurrent_threads_per_session", value(count));
    } else {
        remove_agent_key(doc, "max_concurrent_threads_per_session");
    }
    cleanup_agents_table(doc);
    Ok(())
}

fn write_bytes_safely(path: &Path, bytes: &[u8]) -> Result<(), String> {
    ensure_parent(path)?;
    let parent = path
        .parent()
        .ok_or_else(|| "目标路径没有父目录".to_string())?;
    let name = path
        .file_name()
        .and_then(|v| v.to_str())
        .unwrap_or("config");
    let stamp = now_millis()?;
    let tmp = parent.join(format!(
        ".{name}.config-studio-{}-{stamp}.tmp",
        std::process::id()
    ));

    let mut file = File::create(&tmp).map_err(|e| format!("创建临时文件失败: {e}"))?;
    file.write_all(bytes)
        .map_err(|e| format!("写入临时文件失败: {e}"))?;
    file.sync_all()
        .map_err(|e| format!("同步临时文件失败: {e}"))?;
    drop(file);

    match fs::rename(&tmp, path) {
        Ok(()) => Ok(()),
        Err(first) => {
            if path.exists() {
                fs::remove_file(path)
                    .map_err(|e| format!("替换旧配置失败: {e}; 初始错误: {first}"))?;
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
        if last.config_path == config_path_text && last.values == *values && last.action == action {
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
    let path = resolve_scope(&scope)?;
    let mut doc = read_document(&path)?;
    apply_values_to_doc(&mut doc, &values)?;
    ensure_parent(&path)?;
    ensure_original_backup(&path)?;
    history_backup(&path)?;
    write_document(&path, &doc)?;
    let snapshot = snapshot_for_path(&path)?;
    record_history(&scope, &path, &snapshot.values, "apply", source)?;
    Ok(snapshot)
}

fn clear_managed_inner(scope: ScopeRequest) -> Result<ConfigSnapshot, String> {
    let path = resolve_scope(&scope)?;
    let mut doc = read_document(&path)?;
    apply_values_to_doc(&mut doc, &ManagedConfig::default())?;
    ensure_parent(&path)?;
    ensure_original_backup(&path)?;
    history_backup(&path)?;
    write_document(&path, &doc)?;
    let snapshot = snapshot_for_path(&path)?;
    record_history(
        &scope,
        &path,
        &snapshot.values,
        "clear",
        Some("clear".to_string()),
    )?;
    Ok(snapshot)
}

fn restore_original_inner(scope: ScopeRequest) -> Result<ConfigSnapshot, String> {
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
async fn get_project_usage(
    project_path: Option<String>,
    since_ms: Option<u64>,
    max_files: Option<usize>,
) -> Result<usage::UsageReport, String> {
    tauri::async_runtime::spawn_blocking(move || {
        usage::collect_project_usage(project_path, since_ms, max_files)
    })
    .await
    .map_err(|e| format!("Usage collection task failed: {e}"))?
}

#[tauri::command]
async fn inspect_config(scope: ScopeRequest) -> Result<ConfigInspection, String> {
    tauri::async_runtime::spawn_blocking(move || {
        with_config_lock("检查配置", || inspect_config_inner(scope))
    })
    .await
    .map_err(|e| format!("配置检查任务异常终止: {e}"))?
}

#[tauri::command]
async fn remove_config_key(
    scope: ScopeRequest,
    key_path: Vec<String>,
) -> Result<ConfigSnapshot, String> {
    tauri::async_runtime::spawn_blocking(move || {
        with_config_lock("删除未知配置字段", || remove_config_key_inner(scope, key_path))
    })
    .await
    .map_err(|e| format!("删除配置字段任务异常终止: {e}"))?
}

#[tauri::command]
async fn read_config(scope: ScopeRequest) -> Result<ConfigSnapshot, String> {
    tauri::async_runtime::spawn_blocking(move || {
        with_config_lock("读取配置", || {
            let path = resolve_scope(&scope)?;
            snapshot_for_path(&path)
        })
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
    tauri::async_runtime::spawn_blocking(move || {
        with_config_lock("应用配置", || apply_config_inner(scope, values, source))
    })
    .await
    .map_err(|e| format!("写入任务异常终止: {e}"))?
}

#[tauri::command]
async fn clear_managed_config(scope: ScopeRequest) -> Result<ConfigSnapshot, String> {
    tauri::async_runtime::spawn_blocking(move || {
        with_config_lock("清理配置", || clear_managed_inner(scope))
    })
    .await
    .map_err(|e| format!("清理任务异常终止: {e}"))?
}

#[tauri::command]
async fn restore_original(scope: ScopeRequest) -> Result<ConfigSnapshot, String> {
    tauri::async_runtime::spawn_blocking(move || {
        with_config_lock("恢复原始配置", || restore_original_inner(scope))
    })
    .await
    .map_err(|e| format!("恢复任务异常终止: {e}"))?
}

// Delete history metadata only. The caller must hold CONFIG_WRITE_LOCK.
fn delete_history_entry_inner(id: &str) -> Result<Vec<HistoryEntry>, String> {
    if id.is_empty()
        || id.len() > 256
        || !id.bytes().all(|c| c.is_ascii_alphanumeric() || c == b'-')
    {
        return Err("Invalid history entry ID".into());
    }
    let path = history_file_path()?;
    let text = match fs::read_to_string(&path) {
        Ok(text) => text,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(Vec::new()),
        Err(e) => return Err(format!("Could not read history: {e}")),
    };
    // Do not quarantine or overwrite malformed history during deletion.
    let mut store: HistoryStore = serde_json::from_str(&text)
        .map_err(|e| format!("Invalid history file; left unchanged: {e}"))?;
    let Some(index) = store.entries.iter().position(|entry| entry.id == id) else {
        return Ok(store.entries); // Idempotent retry; no extra disk write.
    };
    store.entries.remove(index);
    write_history_store(&store)?;
    Ok(store.entries)
}

#[tauri::command]
async fn delete_history_entry(id: String) -> Result<Vec<HistoryEntry>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        with_config_lock("Delete history entry", || delete_history_entry_inner(&id))
    })
    .await
    .map_err(|e| format!("History deletion task failed: {e}"))?
}

#[tauri::command]
async fn list_history(limit: Option<usize>) -> Result<Vec<HistoryEntry>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        with_config_lock("读取历史记录", || {
            let mut entries = read_history_store()?.entries;
            entries.truncate(limit.unwrap_or(100).clamp(1, 300));
            Ok(entries)
        })
    })
    .await
    .map_err(|e| format!("读取历史记录任务异常终止: {e}"))?
}

#[tauri::command]
async fn restore_history_entry(id: String) -> Result<HistoryRestoreResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        with_config_lock("恢复历史记录", || {
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
            let mut doc = read_document(&path)?;
            apply_values_to_doc(&mut doc, &entry.values)?;
            ensure_parent(&path)?;
            ensure_original_backup(&path)?;
            history_backup(&path)?;
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
    })
    .await
    .map_err(|e| format!("恢复历史记录任务异常终止: {e}"))?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            inspect_config,
            get_project_usage,
            remove_config_key,
            read_config,
            apply_config,
            clear_managed_config,
            restore_original,
            list_history,
            delete_history_entry,
            restore_history_entry
        ])
        .run(tauri::generate_context!())
        .expect("error while running Codex Config Studio");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn guarded_operation_catches_panic_without_poisoning_lock() {
        let first = with_config_lock("测试操作", || -> Result<(), String> {
            panic!("intentional test panic");
        });
        assert!(first.is_err());

        let second = with_config_lock("后续操作", || Ok::<_, String>(42));
        assert_eq!(
            second.expect("lock should remain usable after caught panic"),
            42
        );
    }
}

#[cfg(test)]
mod config_tests;
