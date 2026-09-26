use serde::Serialize;
use serde_json::Value;
use std::{
    collections::{BTreeMap, HashMap, HashSet},
    env,
    fs::{self, File},
    io::{BufRead, BufReader, Read},
    path::{Path, PathBuf},
    time::UNIX_EPOCH,
};

const DEFAULT_MAX_FILES: usize = 8_000;
const MAX_MAX_FILES: usize = 20_000;
const MAX_ROLLOUT_BYTES: u64 = 128 * 1024 * 1024;
const MAX_LINE_BYTES: usize = 4 * 1024 * 1024;

#[derive(Debug, Clone, Default, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UsageTokens {
    pub input_tokens: i64,
    pub cached_input_tokens: i64,
    pub cache_write_input_tokens: i64,
    pub output_tokens: i64,
    pub reasoning_output_tokens: i64,
    pub total_tokens: i64,
}

impl UsageTokens {
    fn add_assign(&mut self, other: &Self) {
        self.input_tokens += other.input_tokens.max(0);
        self.cached_input_tokens += other.cached_input_tokens.max(0);
        self.cache_write_input_tokens += other.cache_write_input_tokens.max(0);
        self.output_tokens += other.output_tokens.max(0);
        self.reasoning_output_tokens += other.reasoning_output_tokens.max(0);
        self.total_tokens += other.total_tokens.max(0);
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ModelUsage {
    pub model: String,
    pub reasoning: Option<String>,
    pub responses: u64,
    pub usage: UsageTokens,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ModelReroute {
    pub timestamp: String,
    pub from_model: String,
    pub to_model: String,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct DailyUsage {
    pub day: String,
    pub responses: u64,
    pub usage: UsageTokens,
    pub estimated: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct DailyModelUsage {
    pub day: String,
    pub model: String,
    pub reasoning: Option<String>,
    pub responses: u64,
    pub usage: UsageTokens,
    pub estimated: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UsageSession {
    pub thread_id: String,
    pub session_id: String,
    pub cwd: String,
    pub started_at: String,
    pub updated_at: String,
    pub parent_thread_id: Option<String>,
    pub agent_role: Option<String>,
    pub agent_path: Option<String>,
    pub is_subagent: bool,
    pub turns: usize,
    pub responses: u64,
    pub usage_source: String,
    pub usage: UsageTokens,
    pub models: Vec<ModelUsage>,
    pub daily_usage: Vec<DailyUsage>,
    pub daily_model_usage: Vec<DailyModelUsage>,
    pub reroutes: Vec<ModelReroute>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UsageReport {
    pub source: String,
    pub sessions: Vec<UsageSession>,
    pub files_scanned: usize,
    pub files_matched: usize,
    pub parse_errors: usize,
    pub skipped_large_files: usize,
    pub truncated: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ProjectUsageOverview {
    pub project_path: String,
    pub available: bool,
    pub sessions: usize,
    pub turns: usize,
    pub responses: u64,
    pub usage: UsageTokens,
    pub models: Vec<ModelUsage>,
    pub reroutes: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ProjectsUsageOverviewReport {
    pub source: String,
    pub projects: Vec<ProjectUsageOverview>,
    pub files_scanned: usize,
    pub parse_errors: usize,
    pub skipped_large_files: usize,
    pub truncated: bool,
}

#[derive(Debug, Clone, Default)]
struct TurnModel {
    model: String,
    reasoning: Option<String>,
}

#[derive(Debug, Clone, Default)]
struct SessionBuilder {
    thread_id: String,
    session_id: String,
    cwd: String,
    observed_cwds: HashSet<String>,
    started_at: String,
    updated_at: String,
    parent_thread_id: Option<String>,
    agent_role: Option<String>,
    agent_path: Option<String>,
    turns: HashSet<String>,
    turn_models: HashMap<String, TurnModel>,
    last_turn_id: Option<String>,
    last_model: Option<TurnModel>,
    exact_usage: UsageTokens,
    exact_responses: u64,
    has_exact_records: bool,
    model_usage: BTreeMap<(String, Option<String>), (u64, UsageTokens)>,
    daily_usage: BTreeMap<String, (u64, UsageTokens)>,
    daily_model_usage: BTreeMap<(String, String, Option<String>), (u64, UsageTokens)>,
    legacy_total: Option<UsageTokens>,
    reroutes: Vec<ModelReroute>,
}

impl SessionBuilder {
    fn observe_timestamp(&mut self, timestamp: &str) {
        if timestamp.is_empty() {
            return;
        }
        if self.started_at.is_empty() || timestamp < self.started_at.as_str() {
            self.started_at = timestamp.to_string();
        }
        if self.updated_at.is_empty() || timestamp > self.updated_at.as_str() {
            self.updated_at = timestamp.to_string();
        }
    }

    fn observe_cwd(&mut self, cwd: &str) {
        if cwd.trim().is_empty() {
            return;
        }
        if self.cwd.is_empty() {
            self.cwd = cwd.to_string();
        }
        self.observed_cwds.insert(cwd.to_string());
    }

    fn observe_turn_model(
        &mut self,
        turn_id: Option<&str>,
        model: Option<&str>,
        reasoning: Option<String>,
    ) {
        let Some(model) = model.filter(|value| !value.trim().is_empty()) else {
            return;
        };
        let selection = TurnModel {
            model: model.to_string(),
            reasoning,
        };
        self.last_model = Some(selection.clone());
        if let Some(turn_id) = turn_id.filter(|value| !value.is_empty()) {
            self.turns.insert(turn_id.to_string());
            self.turn_models.insert(turn_id.to_string(), selection);
            self.last_turn_id = Some(turn_id.to_string());
        }
    }

    fn observe_usage_record(&mut self, timestamp: &str, payload: &Value, since_day: Option<&str>) {
        self.has_exact_records = true;
        let Some(usage) = parse_tokens(payload.get("usage")) else {
            return;
        };
        if let (Some(day), Some(cutoff)) = (utc_day(timestamp), since_day) {
            if day.as_str() < cutoff {
                return;
            }
        }
        let turn_id = string_value(payload.get("turn_id"));
        if let Some(turn_id) = turn_id.as_deref() {
            self.turns.insert(turn_id.to_string());
            self.last_turn_id = Some(turn_id.to_string());
        }
        self.exact_usage.add_assign(&usage);
        self.exact_responses += 1;
        if let Some(day) = utc_day(timestamp) {
            let entry = self
                .daily_usage
                .entry(day)
                .or_insert_with(|| (0, UsageTokens::default()));
            entry.0 += 1;
            entry.1.add_assign(&usage);
        }

        let selection = turn_id
            .as_deref()
            .and_then(|id| self.turn_models.get(id))
            .cloned()
            .or_else(|| self.last_model.clone())
            .unwrap_or_else(|| TurnModel {
                model: "unknown".to_string(),
                reasoning: None,
            });
        let model_key = (selection.model.clone(), selection.reasoning.clone());
        let entry = self
            .model_usage
            .entry(model_key)
            .or_insert_with(|| (0, UsageTokens::default()));
        entry.0 += 1;
        entry.1.add_assign(&usage);

        if let Some(day) = utc_day(timestamp) {
            let entry = self
                .daily_model_usage
                .entry((day, selection.model, selection.reasoning))
                .or_insert_with(|| (0, UsageTokens::default()));
            entry.0 += 1;
            entry.1.add_assign(&usage);
        }
    }

    fn observe_reroute(&mut self, timestamp: &str, payload: &Value) {
        let Some(from_model) = string_value(payload.get("from_model")) else {
            return;
        };
        let Some(to_model) = string_value(payload.get("to_model")) else {
            return;
        };
        let reason = string_value(payload.get("reason")).unwrap_or_else(|| "unknown".to_string());
        self.reroutes.push(ModelReroute {
            timestamp: timestamp.to_string(),
            from_model,
            to_model: to_model.clone(),
            reason,
        });

        if let Some(turn_id) = self.last_turn_id.clone() {
            let reasoning = self
                .turn_models
                .get(&turn_id)
                .and_then(|selection| selection.reasoning.clone());
            let selection = TurnModel {
                model: to_model,
                reasoning,
            };
            self.turn_models.insert(turn_id, selection.clone());
            self.last_model = Some(selection);
        }
    }

    fn matches_project(&self, project: Option<&str>) -> bool {
        let Some(project) = project else {
            return true;
        };
        self.observed_cwds
            .iter()
            .any(|cwd| normalized_path_is_within(cwd, project))
    }

    fn finish(self) -> UsageSession {
        let exact = self.has_exact_records;
        let usage = if exact {
            self.exact_usage.clone()
        } else {
            self.legacy_total.clone().unwrap_or_default()
        };
        let mut models = self
            .model_usage
            .into_iter()
            .map(|((model, reasoning), (responses, usage))| ModelUsage {
                model,
                reasoning,
                responses,
                usage,
            })
            .collect::<Vec<_>>();

        if !exact && usage.total_tokens > 0 && models.is_empty() {
            let selection = self.last_model.unwrap_or_else(|| TurnModel {
                model: "unknown".to_string(),
                reasoning: None,
            });
            models.push(ModelUsage {
                model: selection.model,
                reasoning: selection.reasoning,
                responses: 0,
                usage: usage.clone(),
            });
        }
        models.sort_by(|a, b| {
            b.usage
                .total_tokens
                .cmp(&a.usage.total_tokens)
                .then_with(|| a.model.cmp(&b.model))
        });

        let mut daily_usage = self
            .daily_usage
            .into_iter()
            .map(|(day, (responses, usage))| DailyUsage {
                day,
                responses,
                usage,
                estimated: false,
            })
            .collect::<Vec<_>>();
        let mut daily_model_usage = self
            .daily_model_usage
            .into_iter()
            .map(|((day, model, reasoning), (responses, usage))| DailyModelUsage {
                day,
                model,
                reasoning,
                responses,
                usage,
                estimated: false,
            })
            .collect::<Vec<_>>();
        if !exact && usage.total_tokens > 0 && daily_usage.is_empty() {
            if let Some(day) = utc_day(&self.updated_at).or_else(|| utc_day(&self.started_at)) {
                daily_usage.push(DailyUsage {
                    day: day.clone(),
                    responses: 0,
                    usage: usage.clone(),
                    estimated: true,
                });
                let selection = models.first().cloned().unwrap_or(ModelUsage {
                    model: "unknown".to_string(),
                    reasoning: None,
                    responses: 0,
                    usage: usage.clone(),
                });
                daily_model_usage.push(DailyModelUsage {
                    day,
                    model: selection.model,
                    reasoning: selection.reasoning,
                    responses: 0,
                    usage: usage.clone(),
                    estimated: true,
                });
            }
        }

        let thread_id = if self.thread_id.is_empty() {
            self.session_id.clone()
        } else {
            self.thread_id
        };
        let session_id = if self.session_id.is_empty() {
            thread_id.clone()
        } else {
            self.session_id
        };
        let is_subagent = self.parent_thread_id.is_some()
            || self.agent_role.is_some()
            || self.agent_path.is_some();

        UsageSession {
            thread_id,
            session_id,
            cwd: self.cwd,
            started_at: self.started_at,
            updated_at: self.updated_at,
            parent_thread_id: self.parent_thread_id,
            agent_role: self.agent_role,
            agent_path: self.agent_path,
            is_subagent,
            turns: self.turns.len(),
            responses: self.exact_responses,
            usage_source: if exact {
                "response_records".to_string()
            } else if self.legacy_total.is_some() {
                "legacy_session_total".to_string()
            } else {
                "none".to_string()
            },
            usage,
            models,
            daily_usage,
            daily_model_usage,
            reroutes: self.reroutes,
        }
    }
}

fn string_value(value: Option<&Value>) -> Option<String> {
    match value {
        Some(Value::String(value)) if !value.trim().is_empty() => Some(value.clone()),
        Some(Value::Number(value)) => Some(value.to_string()),
        _ => None,
    }
}

fn optional_label(value: Option<&Value>) -> Option<String> {
    match value {
        Some(Value::String(value)) if !value.trim().is_empty() => Some(value.clone()),
        Some(value @ Value::Object(_)) | Some(value @ Value::Array(_)) => {
            serde_json::to_string(value).ok()
        }
        _ => None,
    }
}

fn int_value(object: &serde_json::Map<String, Value>, key: &str) -> i64 {
    object.get(key).and_then(Value::as_i64).unwrap_or(0).max(0)
}

fn utc_day(timestamp: &str) -> Option<String> {
    let bytes = timestamp.as_bytes();
    if bytes.len() < 10
        || bytes.get(4) != Some(&b'-')
        || bytes.get(7) != Some(&b'-')
        || !bytes[..10]
            .iter()
            .enumerate()
            .all(|(index, byte)| index == 4 || index == 7 || byte.is_ascii_digit())
    {
        return None;
    }
    Some(timestamp[..10].to_string())
}

fn parse_tokens(value: Option<&Value>) -> Option<UsageTokens> {
    let object = value?.as_object()?;
    Some(UsageTokens {
        input_tokens: int_value(object, "input_tokens"),
        cached_input_tokens: int_value(object, "cached_input_tokens"),
        cache_write_input_tokens: int_value(object, "cache_write_input_tokens"),
        output_tokens: int_value(object, "output_tokens"),
        reasoning_output_tokens: int_value(object, "reasoning_output_tokens"),
        total_tokens: int_value(object, "total_tokens"),
    })
}

fn parse_rollout<R: Read>(reader: R, since_day: Option<&str>) -> (SessionBuilder, usize) {
    let mut builder = SessionBuilder::default();
    let mut errors = 0usize;
    let mut reader = BufReader::new(reader);
    let mut line = String::new();

    loop {
        line.clear();
        match reader.read_line(&mut line) {
            Ok(0) => break,
            Ok(_) => {}
            Err(_) => {
                errors += 1;
                break;
            }
        }
        if line.len() > MAX_LINE_BYTES {
            errors += 1;
            continue;
        }
        let Ok(record) = serde_json::from_str::<Value>(line.trim()) else {
            errors += 1;
            continue;
        };
        let timestamp = record
            .get("timestamp")
            .and_then(Value::as_str)
            .unwrap_or_default();
        builder.observe_timestamp(timestamp);
        let Some(kind) = record.get("type").and_then(Value::as_str) else {
            continue;
        };
        let payload = record.get("payload").unwrap_or(&Value::Null);

        match kind {
            "session_meta" => {
                builder.thread_id = string_value(payload.get("id")).unwrap_or_default();
                builder.session_id = string_value(payload.get("session_id"))
                    .unwrap_or_else(|| builder.thread_id.clone());
                builder.parent_thread_id = string_value(payload.get("parent_thread_id"));
                builder.agent_role = string_value(payload.get("agent_role"));
                builder.agent_path = string_value(payload.get("agent_path"));
                if let Some(cwd) = string_value(payload.get("cwd")) {
                    builder.observe_cwd(&cwd);
                }
            }
            "turn_context" => {
                let turn_id = string_value(payload.get("turn_id"));
                if let Some(cwd) = string_value(payload.get("cwd")) {
                    builder.observe_cwd(&cwd);
                }
                builder.observe_turn_model(
                    turn_id.as_deref(),
                    payload.get("model").and_then(Value::as_str),
                    optional_label(payload.get("effort")),
                );
            }
            "token_usage_record" => builder.observe_usage_record(timestamp, payload, since_day),
            "event_msg" => {
                let event_type = payload.get("type").and_then(Value::as_str).unwrap_or_default();
                match event_type {
                    "turn_started" => {
                        if let Some(turn_id) = string_value(payload.get("turn_id")) {
                            builder.turns.insert(turn_id.clone());
                            builder.last_turn_id = Some(turn_id);
                        }
                    }
                    "thread_settings_applied" => {
                        if let Some(settings) = payload.get("thread_settings") {
                            if let Some(cwd) = string_value(settings.get("cwd")) {
                                builder.observe_cwd(&cwd);
                            }
                            builder.observe_turn_model(
                                None,
                                settings.get("model").and_then(Value::as_str),
                                optional_label(settings.get("reasoning_effort")),
                            );
                        }
                    }
                    "token_count" => {
                        if let Some(total) = payload
                            .get("info")
                            .and_then(|info| info.get("total_token_usage"))
                            .and_then(|value| parse_tokens(Some(value)))
                        {
                            builder.legacy_total = Some(total);
                        }
                    }
                    "model_reroute" => builder.observe_reroute(timestamp, payload),
                    _ => {}
                }
            }
            _ => {}
        }
    }

    (builder, errors)
}

fn normalize_path_text(value: &str) -> String {
    let mut normalized = value.trim().replace('\\', "/");
    while normalized.ends_with('/') && normalized.len() > 1 {
        normalized.pop();
    }
    #[cfg(windows)]
    {
        normalized.make_ascii_lowercase();
    }
    normalized
}

fn normalized_path_is_within(candidate: &str, root: &str) -> bool {
    let candidate = normalize_path_text(candidate);
    let root = normalize_path_text(root);
    if candidate == root {
        return true;
    }
    candidate
        .strip_prefix(&root)
        .is_some_and(|suffix| suffix.starts_with('/'))
}

fn codex_home() -> Result<PathBuf, String> {
    if let Some(custom) = env::var_os("CODEX_HOME").filter(|value| !value.is_empty()) {
        return Ok(PathBuf::from(custom));
    }
    dirs::home_dir()
        .map(|home| home.join(".codex"))
        .ok_or_else(|| "Unable to determine the Codex home directory".to_string())
}

#[derive(Debug)]
struct RolloutFile {
    path: PathBuf,
    modified_ms: u64,
    len: u64,
}

fn collect_rollout_files(root: &Path, output: &mut Vec<RolloutFile>) -> Result<(), String> {
    let entries = match fs::read_dir(root) {
        Ok(entries) => entries,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(()),
        Err(error) => return Err(format!("Could not read Codex sessions: {error}")),
    };
    for entry in entries {
        let entry = match entry {
            Ok(entry) => entry,
            Err(_) => continue,
        };
        let file_type = match entry.file_type() {
            Ok(file_type) => file_type,
            Err(_) => continue,
        };
        if file_type.is_symlink() {
            continue;
        }
        let path = entry.path();
        if file_type.is_dir() {
            collect_rollout_files(&path, output)?;
            continue;
        }
        if !file_type.is_file()
            || path.extension().and_then(|value| value.to_str()) != Some("jsonl")
        {
            continue;
        }
        let metadata = match entry.metadata() {
            Ok(metadata) => metadata,
            Err(_) => continue,
        };
        let modified_ms = metadata
            .modified()
            .ok()
            .and_then(|modified| modified.duration_since(UNIX_EPOCH).ok())
            .map(|duration| duration.as_millis() as u64)
            .unwrap_or(0);
        output.push(RolloutFile {
            path,
            modified_ms,
            len: metadata.len(),
        });
    }
    Ok(())
}

#[derive(Debug)]
struct OverviewProject {
    requested: String,
    canonical: Option<String>,
}

#[derive(Debug, Default)]
struct OverviewAccumulator {
    sessions: usize,
    turns: usize,
    responses: u64,
    usage: UsageTokens,
    models: BTreeMap<(String, Option<String>), (u64, UsageTokens)>,
    reroutes: usize,
}

impl OverviewAccumulator {
    fn add_session(&mut self, session: UsageSession) {
        self.sessions += 1;
        self.turns += session.turns;
        self.responses += session.responses;
        self.usage.add_assign(&session.usage);
        self.reroutes += session.reroutes.len();
        for row in session.models {
            let entry = self
                .models
                .entry((row.model, row.reasoning))
                .or_insert_with(|| (0, UsageTokens::default()));
            entry.0 += row.responses;
            entry.1.add_assign(&row.usage);
        }
    }

    fn finish(self, project_path: String, available: bool) -> ProjectUsageOverview {
        let mut models = self
            .models
            .into_iter()
            .map(|((model, reasoning), (responses, usage))| ModelUsage {
                model,
                reasoning,
                responses,
                usage,
            })
            .collect::<Vec<_>>();
        models.sort_by(|a, b| {
            b.usage
                .total_tokens
                .cmp(&a.usage.total_tokens)
                .then_with(|| a.model.cmp(&b.model))
        });
        ProjectUsageOverview {
            project_path,
            available,
            sessions: self.sessions,
            turns: self.turns,
            responses: self.responses,
            usage: self.usage,
            models,
            reroutes: self.reroutes,
        }
    }
}

fn overview_projects(project_paths: Vec<String>) -> Vec<OverviewProject> {
    let mut seen = HashSet::new();
    project_paths
        .into_iter()
        .filter_map(|raw| {
            let requested = raw.trim().to_string();
            if requested.is_empty() || !seen.insert(normalize_path_text(&requested)) {
                return None;
            }
            let path = PathBuf::from(&requested);
            let canonical = if path.exists() && path.is_dir() {
                Some(
                    path.canonicalize()
                        .unwrap_or(path)
                        .to_string_lossy()
                        .to_string(),
                )
            } else {
                None
            };
            Some(OverviewProject {
                requested,
                canonical,
            })
        })
        .take(20)
        .collect()
}

fn best_overview_project(builder: &SessionBuilder, projects: &[OverviewProject]) -> Option<usize> {
    let mut best: Option<(usize, usize)> = None;
    for cwd in &builder.observed_cwds {
        for (index, project) in projects.iter().enumerate() {
            let Some(root) = project.canonical.as_deref() else {
                continue;
            };
            if normalized_path_is_within(cwd, root) {
                let specificity = normalize_path_text(root).len();
                if best.map_or(true, |(_, current)| specificity > current) {
                    best = Some((index, specificity));
                }
            }
        }
    }
    best.map(|(index, _)| index)
}

pub(crate) fn collect_projects_usage_overview(
    project_paths: Vec<String>,
    since_ms: Option<u64>,
    since_day: Option<String>,
    max_files: Option<usize>,
) -> Result<ProjectsUsageOverviewReport, String> {
    let projects = overview_projects(project_paths);
    let sessions_root = codex_home()?.join("sessions");
    let mut files = Vec::new();
    collect_rollout_files(&sessions_root, &mut files)?;
    files.sort_by(|a, b| b.modified_ms.cmp(&a.modified_ms));
    if let Some(since_ms) = since_ms {
        files.retain(|file| file.modified_ms == 0 || file.modified_ms >= since_ms);
    }

    let max_files = max_files
        .unwrap_or(DEFAULT_MAX_FILES)
        .clamp(100, MAX_MAX_FILES);
    let truncated = files.len() > max_files;
    files.truncate(max_files);
    let files_scanned = files.len();

    let mut accumulators = (0..projects.len())
        .map(|_| OverviewAccumulator::default())
        .collect::<Vec<_>>();
    let mut parse_errors = 0usize;
    let mut skipped_large_files = 0usize;

    for file in files {
        if file.len > MAX_ROLLOUT_BYTES {
            skipped_large_files += 1;
            continue;
        }
        let reader = match File::open(&file.path) {
            Ok(reader) => reader,
            Err(_) => {
                parse_errors += 1;
                continue;
            }
        };
        let (builder, errors) = parse_rollout(reader, since_day.as_deref());
        parse_errors += errors;
        if builder.thread_id.is_empty() && builder.session_id.is_empty() {
            continue;
        }
        if since_day.is_some() && builder.has_exact_records && builder.exact_responses == 0 {
            continue;
        }
        let Some(index) = best_overview_project(&builder, &projects) else {
            continue;
        };
        accumulators[index].add_session(builder.finish());
    }

    let projects = projects
        .into_iter()
        .zip(accumulators)
        .map(|(project, accumulator)| {
            accumulator.finish(project.requested, project.canonical.is_some())
        })
        .collect();

    Ok(ProjectsUsageOverviewReport {
        source: "codex_rollout_jsonl".to_string(),
        projects,
        files_scanned,
        parse_errors,
        skipped_large_files,
        truncated,
    })
}

pub(crate) fn collect_project_usage(
    project_path: Option<String>,
    since_ms: Option<u64>,
    since_day: Option<String>,
    max_files: Option<usize>,
) -> Result<UsageReport, String> {
    let project = match project_path {
        Some(raw) if !raw.trim().is_empty() => {
            let path = PathBuf::from(raw.trim());
            if !path.exists() || !path.is_dir() {
                return Err("Project directory does not exist or is not a directory".to_string());
            }
            Some(
                path.canonicalize()
                    .unwrap_or(path)
                    .to_string_lossy()
                    .to_string(),
            )
        }
        _ => None,
    };

    let sessions_root = codex_home()?.join("sessions");
    let mut files = Vec::new();
    collect_rollout_files(&sessions_root, &mut files)?;
    files.sort_by(|a, b| b.modified_ms.cmp(&a.modified_ms));

    if let Some(since_ms) = since_ms {
        files.retain(|file| file.modified_ms == 0 || file.modified_ms >= since_ms);
    }

    let max_files = max_files
        .unwrap_or(DEFAULT_MAX_FILES)
        .clamp(100, MAX_MAX_FILES);
    let truncated = files.len() > max_files;
    files.truncate(max_files);

    let mut sessions = Vec::new();
    let mut parse_errors = 0usize;
    let mut skipped_large_files = 0usize;
    let files_scanned = files.len();

    for file in files {
        if file.len > MAX_ROLLOUT_BYTES {
            skipped_large_files += 1;
            continue;
        }
        let reader = match File::open(&file.path) {
            Ok(reader) => reader,
            Err(_) => {
                parse_errors += 1;
                continue;
            }
        };
        let (builder, errors) = parse_rollout(reader, since_day.as_deref());
        parse_errors += errors;
        if builder.thread_id.is_empty() && builder.session_id.is_empty() {
            continue;
        }
        if !builder.matches_project(project.as_deref()) {
            continue;
        }
        // With exact response records, a period view should count only sessions that
        // actually produced a model response inside the requested UTC-day window.
        // A recently modified rollout may still contain only older responses.
        if since_day.is_some() && builder.has_exact_records && builder.exact_responses == 0 {
            continue;
        }
        sessions.push(builder.finish());
    }

    sessions.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    let files_matched = sessions.len();

    Ok(UsageReport {
        source: "codex_rollout_jsonl".to_string(),
        sessions,
        files_scanned,
        files_matched,
        parse_errors,
        skipped_large_files,
        truncated,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;

    fn sample_rollout() -> String {
        [
            r#"{"timestamp":"2026-09-26T01:00:00Z","type":"session_meta","payload":{"id":"thread-1","session_id":"session-1","cwd":"/work/demo","parent_thread_id":null,"agent_role":null}}"#,
            r#"{"timestamp":"2026-09-26T01:00:01Z","type":"turn_context","payload":{"turn_id":"turn-1","cwd":"/work/demo","model":"gpt-6-luna","effort":"xhigh"}}"#,
            r#"{"timestamp":"2026-09-26T01:00:02Z","type":"token_usage_record","payload":{"thread_id":"thread-1","turn_id":"turn-1","session_id":"session-1","root_turn_id":"turn-1","response_id":"r1","usage":{"input_tokens":100,"cached_input_tokens":40,"output_tokens":20,"reasoning_output_tokens":7,"total_tokens":120},"turn_token_usage":{"total_tokens":120},"thread_token_usage":{"total_tokens":120}}}"#,
            r#"{"timestamp":"2026-09-26T01:00:03Z","type":"event_msg","payload":{"type":"model_reroute","from_model":"gpt-6-luna","to_model":"gpt-6-sol","reason":"high_risk_cyber_activity"}}"#,
            r#"{"timestamp":"2026-09-26T01:00:04Z","type":"token_usage_record","payload":{"thread_id":"thread-1","turn_id":"turn-1","session_id":"session-1","root_turn_id":"turn-1","response_id":"r2","usage":{"input_tokens":50,"cached_input_tokens":10,"output_tokens":15,"reasoning_output_tokens":3,"total_tokens":65},"turn_token_usage":{"total_tokens":185},"thread_token_usage":{"total_tokens":185}}}"#,
        ]
        .join("\n")
    }

    #[test]
    fn parses_exact_usage_and_reroutes_without_double_counting_cumulative_totals() {
        let (builder, errors) = parse_rollout(Cursor::new(sample_rollout()), None);
        assert_eq!(errors, 0);
        let session = builder.finish();
        assert_eq!(session.thread_id, "thread-1");
        assert_eq!(session.responses, 2);
        assert_eq!(session.usage.total_tokens, 185);
        assert_eq!(session.usage.input_tokens, 150);
        assert_eq!(session.reroutes.len(), 1);
        assert_eq!(session.reroutes[0].to_model, "gpt-6-sol");
        assert_eq!(session.models.iter().map(|item| item.usage.total_tokens).sum::<i64>(), 185);
        assert_eq!(session.models[0].model, "gpt-6-luna");
        assert_eq!(session.models[1].model, "gpt-6-sol");
        assert_eq!(session.daily_usage.len(), 1);
        assert_eq!(session.daily_usage[0].day, "2026-09-26");
        assert_eq!(session.daily_usage[0].responses, 2);
        assert_eq!(session.daily_usage[0].usage.total_tokens, 185);
        assert!(!session.daily_usage[0].estimated);
        assert_eq!(session.daily_model_usage.len(), 2);
        assert_eq!(session.daily_model_usage.iter().map(|item| item.usage.total_tokens).sum::<i64>(), 185);
    }

    #[test]
    fn exact_usage_respects_day_cutoff_without_falling_back_to_legacy_totals() {
        let text = [
            r#"{"timestamp":"2026-09-20T01:00:00Z","type":"session_meta","payload":{"id":"cutoff","cwd":"/work/demo"}}"#,
            r#"{"timestamp":"2026-09-20T01:00:01Z","type":"turn_context","payload":{"turn_id":"t","cwd":"/work/demo","model":"gpt-6-luna","effort":"xhigh"}}"#,
            r#"{"timestamp":"2026-09-20T01:00:02Z","type":"token_usage_record","payload":{"thread_id":"cutoff","turn_id":"t","session_id":"cutoff","root_turn_id":"t","response_id":"old","usage":{"input_tokens":90,"cached_input_tokens":0,"output_tokens":10,"reasoning_output_tokens":0,"total_tokens":100},"turn_token_usage":{"total_tokens":100},"thread_token_usage":{"total_tokens":100}}}"#,
            r#"{"timestamp":"2026-09-26T01:00:02Z","type":"token_usage_record","payload":{"thread_id":"cutoff","turn_id":"t","session_id":"cutoff","root_turn_id":"t","response_id":"new","usage":{"input_tokens":45,"cached_input_tokens":0,"output_tokens":5,"reasoning_output_tokens":0,"total_tokens":50},"turn_token_usage":{"total_tokens":150},"thread_token_usage":{"total_tokens":150}}}"#,
            r#"{"timestamp":"2026-09-26T01:00:03Z","type":"event_msg","payload":{"type":"token_count","info":{"total_token_usage":{"input_tokens":135,"cached_input_tokens":0,"output_tokens":15,"reasoning_output_tokens":0,"total_tokens":150},"last_token_usage":{"total_tokens":50},"model_context_window":200000},"rate_limits":null}}"#,
        ].join("\n");
        let (builder, errors) = parse_rollout(Cursor::new(text), Some("2026-09-25"));
        assert_eq!(errors, 0);
        let session = builder.finish();
        assert_eq!(session.usage_source, "response_records");
        assert_eq!(session.responses, 1);
        assert_eq!(session.usage.total_tokens, 50);
        assert_eq!(session.daily_usage.len(), 1);
        assert_eq!(session.daily_usage[0].day, "2026-09-26");
    }

    #[test]
    fn period_filter_can_identify_exact_sessions_with_no_in_window_responses() {
        let text = [
            r#"{"timestamp":"2026-09-20T01:00:00Z","type":"session_meta","payload":{"id":"old-only","cwd":"/work/demo"}}"#,
            r#"{"timestamp":"2026-09-20T01:00:01Z","type":"turn_context","payload":{"turn_id":"t","cwd":"/work/demo","model":"gpt-6-luna","effort":"xhigh"}}"#,
            r#"{"timestamp":"2026-09-20T01:00:02Z","type":"token_usage_record","payload":{"thread_id":"old-only","turn_id":"t","session_id":"old-only","root_turn_id":"t","response_id":"old","usage":{"input_tokens":90,"cached_input_tokens":0,"output_tokens":10,"reasoning_output_tokens":0,"total_tokens":100},"turn_token_usage":{"total_tokens":100},"thread_token_usage":{"total_tokens":100}}}"#,
        ].join("\n");
        let (builder, errors) = parse_rollout(Cursor::new(text), Some("2026-09-25"));
        assert_eq!(errors, 0);
        assert!(builder.has_exact_records);
        assert_eq!(builder.exact_responses, 0);
        assert_eq!(builder.exact_usage.total_tokens, 0);
    }

    #[test]
    fn legacy_token_count_is_used_only_when_exact_response_records_are_absent() {
        let text = [
            r#"{"timestamp":"2026-09-26T01:00:00Z","type":"session_meta","payload":{"id":"legacy","cwd":"/work/demo"}}"#,
            r#"{"timestamp":"2026-09-26T01:00:01Z","type":"turn_context","payload":{"turn_id":"t","cwd":"/work/demo","model":"gpt-5.6-luna","effort":"high"}}"#,
            r#"{"timestamp":"2026-09-26T01:00:02Z","type":"event_msg","payload":{"type":"token_count","info":{"total_token_usage":{"input_tokens":80,"cached_input_tokens":10,"output_tokens":20,"reasoning_output_tokens":5,"total_tokens":100},"last_token_usage":{"total_tokens":100},"model_context_window":200000},"rate_limits":null}}"#,
        ]
        .join("\n");
        let (builder, errors) = parse_rollout(Cursor::new(text), None);
        assert_eq!(errors, 0);
        let session = builder.finish();
        assert_eq!(session.usage_source, "legacy_session_total");
        assert_eq!(session.usage.total_tokens, 100);
        assert_eq!(session.models[0].model, "gpt-5.6-luna");
        assert_eq!(session.daily_usage.len(), 1);
        assert_eq!(session.daily_usage[0].day, "2026-09-26");
        assert_eq!(session.daily_usage[0].usage.total_tokens, 100);
        assert!(session.daily_usage[0].estimated);
        assert_eq!(session.daily_model_usage.len(), 1);
        assert_eq!(session.daily_model_usage[0].model, "gpt-5.6-luna");
        assert!(session.daily_model_usage[0].estimated);
    }

    #[test]
    fn invalid_or_short_timestamps_do_not_create_daily_buckets() {
        assert_eq!(utc_day(""), None);
        assert_eq!(utc_day("2026-9-2"), None);
        assert_eq!(utc_day("2026/09/26T01:00:00Z"), None);
        assert_eq!(utc_day("2026-09-26T01:00:00Z"), Some("2026-09-26".to_string()));
    }

    #[test]
    fn overview_prefers_the_most_specific_matching_project_root() {
        let mut builder = SessionBuilder::default();
        builder.observe_cwd("/work/demo/nested/src");
        let projects = vec![
            OverviewProject { requested: "/work/demo".to_string(), canonical: Some("/work/demo".to_string()) },
            OverviewProject { requested: "/work/demo/nested".to_string(), canonical: Some("/work/demo/nested".to_string()) },
        ];
        assert_eq!(best_overview_project(&builder, &projects), Some(1));
    }

    #[test]
    fn overview_accumulator_keeps_model_usage_and_session_totals() {
        let (builder, errors) = parse_rollout(Cursor::new(sample_rollout()), None);
        assert_eq!(errors, 0);
        let mut accumulator = OverviewAccumulator::default();
        accumulator.add_session(builder.finish());
        let overview = accumulator.finish("/work/demo".to_string(), true);
        assert_eq!(overview.sessions, 1);
        assert_eq!(overview.responses, 2);
        assert_eq!(overview.usage.total_tokens, 185);
        assert_eq!(overview.models.len(), 2);
        assert_eq!(overview.reroutes, 1);
    }

    #[test]
    fn project_matching_includes_nested_working_directories_but_not_prefix_collisions() {
        assert!(normalized_path_is_within("/work/demo", "/work/demo"));
        assert!(normalized_path_is_within("/work/demo/src", "/work/demo"));
        assert!(!normalized_path_is_within("/work/demo-old", "/work/demo"));
    }
}
