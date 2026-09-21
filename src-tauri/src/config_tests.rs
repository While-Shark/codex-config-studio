use super::*;

struct Sandbox {
    root: PathBuf,
    previous_home: Option<PathBuf>,
}

impl Sandbox {
    fn new() -> Self {
        let root = std::env::temp_dir().join(format!(
            "studio-config-test-{}-{}-{}",
            std::process::id(),
            now_millis().unwrap(),
            HISTORY_SEQ.fetch_add(1, Ordering::Relaxed)
        ));
        let home = root.join("home");
        fs::create_dir_all(&home).unwrap();
        let previous_home = TEST_CONFIG_HOME.with(|cell| cell.replace(Some(home)));
        Self {
            root,
            previous_home,
        }
    }
    fn project(&self, name: &str) -> ScopeRequest {
        let project = self.root.join(name);
        fs::create_dir_all(&project).unwrap();
        ScopeRequest {
            kind: "project".into(),
            project_path: Some(project.to_string_lossy().into_owned()),
        }
    }
}
impl Drop for Sandbox {
    fn drop(&mut self) {
        TEST_CONFIG_HOME.with(|cell| *cell.borrow_mut() = self.previous_home.take());
        let _ = fs::remove_dir_all(&self.root);
    }
}

fn daily() -> ManagedConfig {
    ManagedConfig {
        model: Some("gpt-5.6-terra".into()),
        model_reasoning_effort: Some("medium".into()),
        plan_mode_reasoning_effort: Some("high".into()),
        agents_enabled: Some(true),
        default_subagent_model: Some("gpt-5.6-luna".into()),
        default_subagent_reasoning_effort: Some("medium".into()),
        max_concurrent_threads_per_session: Some(2),
    }
}
fn apply(scope: &ScopeRequest, values: &ManagedConfig) -> Result<ConfigSnapshot, String> {
    with_config_lock("regression apply", || {
        apply_config_inner(scope.clone(), values.clone(), Some("regression".into()))
    })
}
fn write_input(scope: &ScopeRequest, text: &str) -> PathBuf {
    let path = resolve_scope(scope).unwrap();
    ensure_parent(&path).unwrap();
    fs::write(&path, text).unwrap();
    path
}

#[test]
fn project_without_codex_directory_is_created_and_history_recorded() {
    let sandbox = Sandbox::new();
    let scope = sandbox.project("project-a");
    let path = resolve_scope(&scope).unwrap();
    assert!(!path.parent().unwrap().exists());
    let before = snapshot_for_path(&path).unwrap();
    assert!(!before.exists);
    assert!(
        !path.parent().unwrap().exists(),
        "read must not create files"
    );
    let expected = daily();
    let after = apply(&scope, &expected).expect("first project application must succeed");
    assert!(path.is_file());
    assert!(after.exists);
    assert_eq!(after.values, expected);
    assert_eq!(read_values(&read_document(&path).unwrap()), expected);
    assert!(after.original_backup_exists);
    assert!(backup_dir(&path)
        .unwrap()
        .join("config.original.absent")
        .is_file());
    let history = read_history_store().unwrap();
    assert_eq!(history.entries.len(), 1);
    assert_eq!(history.entries[0].values, expected);
    assert_eq!(history.entries[0].project_path, scope.project_path);
}

#[test]
fn project_with_directory_but_without_config_file_is_created() {
    let sandbox = Sandbox::new();
    let scope = sandbox.project("project-b");
    let path = resolve_scope(&scope).unwrap();
    ensure_parent(&path).unwrap();
    assert!(!path.exists());
    assert!(apply(&scope, &daily()).unwrap().exists);
}

#[test]
fn global_config_without_codex_directory_is_created_in_test_home() {
    let _sandbox = Sandbox::new();
    let scope = ScopeRequest {
        kind: "global".into(),
        project_path: None,
    };
    let path = resolve_scope(&scope).unwrap();
    assert!(!path.exists());
    let result = apply(&scope, &daily()).unwrap();
    assert!(result.exists);
    assert_eq!(result.values, daily());
    assert!(path.is_file());
}

#[test]
fn empty_and_whitespace_files_accept_first_application() {
    let sandbox = Sandbox::new();
    for (i, input) in ["", "  \n\t\n"].iter().enumerate() {
        let scope = sandbox.project(&format!("empty-{i}"));
        let path = write_input(&scope, input);
        assert_eq!(apply(&scope, &daily()).unwrap().values, daily());
        assert_eq!(read_values(&read_document(&path).unwrap()), daily());
        assert_eq!(
            fs::read_to_string(backup_dir(&path).unwrap().join("config.original.toml")).unwrap(),
            *input
        );
    }
}

#[test]
fn missing_agents_preserves_mcp_hooks_plugins_and_original_backup() {
    let sandbox = Sandbox::new();
    let scope = sandbox.project("existing");
    let original = r#"# keep this user's comment
model = "previous-model"
approval_policy = "on-request"
[mcp_servers.local]
command = "my-mcp"
[plugins.sample]
enabled = true
[hooks.state.sample]
trusted_hash = "not-a-real-secret"
[projects.sample]
trust_level = "trusted"
"#;
    let path = write_input(&scope, original);
    apply(&scope, &daily()).unwrap();
    let doc = read_document(&path).unwrap();
    let before: DocumentMut = original.parse().unwrap();
    for key in [
        "approval_policy",
        "mcp_servers",
        "plugins",
        "hooks",
        "projects",
    ] {
        assert_eq!(
            doc.get(key).unwrap().to_string(),
            before.get(key).unwrap().to_string(),
            "unrelated key changed: {key}"
        );
    }
    assert!(fs::read_to_string(&path)
        .unwrap()
        .contains("# keep this user's comment"));
    assert_eq!(
        fs::read_to_string(backup_dir(&path).unwrap().join("config.original.toml")).unwrap(),
        original
    );
}

#[test]
fn existing_empty_agents_table_accepts_all_fields() {
    let sandbox = Sandbox::new();
    let scope = sandbox.project("empty-agents");
    write_input(&scope, "[agents]\n");
    assert_eq!(apply(&scope, &daily()).unwrap().values, daily());
}

#[test]
fn inline_agents_can_be_read_edited_and_cleared_without_losing_other_keys() {
    let sandbox = Sandbox::new();
    let scope = sandbox.project("inline");
    let path = write_input(&scope, "agents = { enabled = false, user_option = 7 }\n");
    assert_eq!(
        read_values(&read_document(&path).unwrap()).agents_enabled,
        Some(false)
    );
    assert_eq!(apply(&scope, &daily()).unwrap().values, daily());
    let doc = read_document(&path).unwrap();
    assert!(doc.get("agents").unwrap().is_inline_table());
    assert_eq!(
        doc.get("agents")
            .and_then(Item::as_table_like)
            .unwrap()
            .get("user_option")
            .and_then(Item::as_integer),
        Some(7)
    );
    with_config_lock("regression clear", || clear_managed_inner(scope.clone())).unwrap();
    let doc = read_document(&path).unwrap();
    let agents = doc.get("agents").and_then(Item::as_table_like).unwrap();
    assert_eq!(
        agents.get("user_option").and_then(Item::as_integer),
        Some(7)
    );
    assert!(agents.get("enabled").is_none());
}

#[test]
fn clearing_managed_keys_keeps_custom_agent_roles() {
    let sandbox = Sandbox::new();
    let scope = sandbox.project("roles");
    let path = write_input(
        &scope,
        "[agents]\nenabled = false\n[agents.reviewer]\nconfig_file = 'review.toml'\n",
    );
    apply(&scope, &daily()).unwrap();
    with_config_lock("regression clear", || clear_managed_inner(scope.clone())).unwrap();
    let doc = read_document(&path).unwrap();
    let roles = doc.get("agents").and_then(Item::as_table_like).unwrap();
    assert!(roles.get("enabled").is_none());
    assert_eq!(
        roles
            .get("reviewer")
            .and_then(Item::as_table_like)
            .unwrap()
            .get("config_file")
            .and_then(Item::as_str),
        Some("review.toml")
    );
}

#[test]
fn invalid_agents_types_return_error_without_changing_files() {
    let sandbox = Sandbox::new();
    for (i, shape) in ["false", "1", "'custom'", "[]", "[{name='worker'}]"]
        .iter()
        .enumerate()
    {
        let scope = sandbox.project(&format!("invalid-{i}"));
        let original = format!("agents = {shape}\nmodel = 'old'\n");
        let path = write_input(&scope, &original);
        let result = apply(&scope, &daily());
        assert!(result.unwrap_err().contains("'agents' must be a table"));
        assert_eq!(fs::read_to_string(&path).unwrap(), original);
        assert!(
            !original_state_exists(&path).unwrap(),
            "validation must precede backup/writes"
        );
    }
    assert!(!history_file_path().unwrap().exists());
    let valid = sandbox.project("valid-after-errors");
    assert!(
        apply(&valid, &daily()).is_ok(),
        "validation errors must not poison subsequent applies"
    );
}

#[test]
fn malformed_toml_is_not_overwritten() {
    let sandbox = Sandbox::new();
    let scope = sandbox.project("bad-toml");
    let original = "[agents\nmodel = 'broken'\n";
    let path = write_input(&scope, original);
    assert!(apply(&scope, &daily()).is_err());
    assert_eq!(fs::read_to_string(path).unwrap(), original);
    assert!(!history_file_path().unwrap().exists());
}

#[test]
fn repeated_apply_and_original_restore_work_for_a_new_project() {
    let sandbox = Sandbox::new();
    let scope = sandbox.project("repeat");
    let path = resolve_scope(&scope).unwrap();
    let mut config = daily();
    for effort in ["medium", "xhigh", "low"] {
        config.model_reasoning_effort = Some(effort.into());
        assert_eq!(apply(&scope, &config).unwrap().values, config);
        assert_eq!(read_values(&read_document(&path).unwrap()), config);
    }
    assert_eq!(read_history_store().unwrap().entries.len(), 3);
    let restored = with_config_lock("regression restore", || {
        restore_original_inner(scope.clone())
    })
    .unwrap();
    assert!(!restored.exists);
    assert!(
        !path.exists(),
        "restore must honor the original absent-file state"
    );
    assert!(apply(&scope, &daily()).unwrap().exists);
}

#[test]
fn separate_projects_keep_separate_configurations_and_history() {
    let sandbox = Sandbox::new();
    let a = sandbox.project("A");
    let b = sandbox.project("B");
    let mut b_values = daily();
    b_values.model = Some("gpt-5.6-luna".into());
    b_values.model_reasoning_effort = Some("xhigh".into());
    apply(&a, &daily()).unwrap();
    apply(&b, &b_values).unwrap();
    assert_eq!(
        snapshot_for_path(&resolve_scope(&a).unwrap())
            .unwrap()
            .values,
        daily()
    );
    assert_eq!(
        snapshot_for_path(&resolve_scope(&b).unwrap())
            .unwrap()
            .values,
        b_values
    );
    let history = read_history_store().unwrap();
    assert_eq!(history.entries.len(), 2);
    assert_ne!(
        history.entries[0].config_path,
        history.entries[1].config_path
    );
}

#[test]
fn model_only_update_does_not_create_agents_table() {
    let sandbox = Sandbox::new();
    let scope = sandbox.project("model-only");
    let config = ManagedConfig {
        model: Some("custom-model".into()),
        ..Default::default()
    };
    apply(&scope, &config).unwrap();
    let doc = read_document(&resolve_scope(&scope).unwrap()).unwrap();
    assert!(doc.get("agents").is_none());
    assert_eq!(read_values(&doc), config);
}

#[test]
fn invalid_concurrency_is_rejected_without_creating_config() {
    let sandbox = Sandbox::new();
    let scope = sandbox.project("invalid-concurrency");
    let mut config = daily();
    config.max_concurrent_threads_per_session = Some(0);
    assert!(apply(&scope, &config).is_err());
    assert!(!resolve_scope(&scope).unwrap().exists());
}
