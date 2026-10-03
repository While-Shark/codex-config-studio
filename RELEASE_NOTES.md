# Codex Config Studio — Release Highlights

## 简体中文

- 🧠 **GPT-6.1 角色分层方案定版**：新增 `2026-10-03` 当前方案版本并完整归档 v0.6.1 方案。Token Saver / Economy 降低 Plan Mode 消耗；Balanced 继续由 GPT-6.1 Sol + Luna 执行；Astra 总指挥升级为 GPT-6 Astra high/xhigh 负责规划与 Review、GPT-6.1 Sol medium 负责复杂执行；极致方案升级为 GPT-6 Astra xhigh + GPT-6.1 Sol high。已有项目与历史方案不会自动迁移。
- 🔔 **主动自动检查稳定版更新**：启动后会在签名 Updater 就绪后自动检查最新稳定版，发现新版本会主动提示；应用持续运行时每 6 小时后台复查，休眠/切回应用且检查已过期时也会补查。同一版本的主动提醒 24 小时内最多一次，手动“检查更新”仍会立即反馈；自动检查失败不会弹错打扰使用。
- 🧠 **GPT-6.1 Sol 与方案版本化**：均衡方案和“复杂问题”默认升级到 GPT-6.1 Sol；GPT-6（v0.5.0）与 v0.4.0 方案继续作为不可变历史快照保留。浏览历史方案不会改写当前配置，已有项目也不会被自动迁移。
- 🎚️ **按模型能力约束 Reasoning**：已知官方模型只展示 Codex 官方 `models.json` 声明支持的思考等级。读取旧配置或自定义模型时继续保留原值；只有用户主动切换到已知官方模型且旧等级不兼容时，才使用该模型官方默认 Reasoning，避免生成新的无效组合。
- 🧩 **Codex 客户端兼容性提示**：Config Health 会读取官方模型目录中的 `minimal_client_version`，把当前主模型/子 Agent 与本机 Codex CLI 版本比较。客户端过旧时只显示只读警告，不隐藏模型、不阻止保存、不自动升级 Codex，也不改写配置。
- 🩺 **环境状态中心**：Config Health 现在统一展示 Codex CLI、官方配置 Schema、官方模型目录与签名 Updater 的状态，并区分最新、缓存/较旧与不可用，附带最近更新时间；这些状态均为只读诊断。
- 🔎 **Schema 规则级差异解释**：官方 Schema 更新后，变更字段不仅显示 `+ / - / ~`，还会进一步说明类型、默认值、枚举、required 或其他校验规则发生了什么变化；未知/未来字段仍默认保留，不会自动删除。
- 📐 **Agent 效率指标**：Agent 分析新增每角色平均 Token/会话、平均 Token/轮次、平均 Token/响应，用于观察资源消耗结构；这些数值不被解释为质量评分。
- 🧭 **项目级 Agent 摘要**：项目总览直接显示 Root Agent 与 Sub-agent 的 Token 和会话分布，并继续支持一键进入项目用量详情页；该摘要复用现有单次 rollout 扫描，不额外重复扫描项目历史。

- ⚡ **Service Tier 遥测与 Fast 参考成本**：本机 rollout 中已持久化的 thread settings 现在会作为 service tier 证据；精确响应按“模型 × tier”归因。当前 Codex 的 `priority` 识别为 Fast，并仅在官方费率明确提供模型倍率时计入 Fast 附加成本。缺少 tier 证据、Flex/未知 tier 或 Fast 倍率不明确时会标记为近似值；不会猜测长上下文、区域处理或未知模型价格。
- 🤖 **官方模型目录自动刷新**：主模型、默认子 Agent 和当前任务的候选模型会读取 OpenAI Codex 官方 `models.json`，仅采用官方标记为可列出的模型，并按官方优先级排序。本机缓存 24 小时；离线或刷新失败时继续使用最近缓存与内置兼容列表。不会自动迁移已有配置、任务偏好、历史、Preset 或自定义模型 ID。
- 🧾 **Release 构建来源证明**：正式发布现在会为最终安装包、更新签名、`latest.json` 与 `SHA256SUMS.txt` 生成 GitHub artifact attestation。可使用 `gh attestation verify <文件> --repo While-Shark/codex-config-studio` 验证文件确实由本仓库 Release workflow 构建。该证明与 Windows/macOS 平台签名及 Tauri updater 签名相互独立、互为补充。
- 📈 **可解释用量异常提示**：项目用量页现在会标记明显的每日 Token 突增。只使用精确逐响应数据；至少需要 3 个历史活跃日，以最近最多 7 个精确活跃日中位数为基线，基线至少 10K Token 且当天达到 2.5× 以上才提示。旧版估算数据不会触发，且该提示不评价模型质量、也不是账单告警。
- 🧭 **配置健康与官方 schema 变更中心**：优先使用 OpenAI Codex 仓库生成的权威配置 schema，并安全缓存最近可信版本；未知/未来字段默认保留，只有在 schema 足够新且可信时才会给出未知字段清理提示，清理前必须确认并备份。配置健康页还会显示本机 Codex CLI 版本，并汇总权威 schema 的新增、移除和结构变化字段。
- 📊 **项目用量、趋势与参考成本**：基于本机 Codex rollout JSONL 的只读遥测，支持 7 天 / 30 天 / 全部时间、模型与 Reasoning 分布、主会话/子 Agent、每日与模型趋势、Agent 分析、可观测 reroute 时间线、近期项目概览和版本化参考成本。旧格式数据会明确标记估算；未知模型不猜价格；这些数据是 best-effort 本地遥测，不是官方账单。
- 🔒 **Model Integrity 运行时核验**：可按作用域锁定有效模型与 Reasoning、检测 Studio 可见配置漂移，并与本机 rollout 已记录的运行时证据核对。界面展示最近主会话的实际模型/Reasoning、reroute 次数、最近 5 条证据，并支持只读手动刷新。仅 CLI 临时覆盖、未被本机记录的行为和不可观测的服务端内部路由仍不属于本地保证范围。

- 🔄 **稳定版更新与签名原地升级**：应用会检查 GitHub 最新稳定版；正式签名构建可在应用内下载、校验签名并安装更新，Windows 使用 NSIS，Linux 会按 AppImage / deb 安装来源匹配更新包，macOS 使用签名更新包并在安装后重启。`v0.5.0` 尚未包含 Updater，因此升级到 `v0.6.0` 需要从 GitHub Releases 手动安装一次；从 `v0.6.0` 开始才具备后续签名原地升级能力。Nightly / 本地未签名构建继续回退到 GitHub Release 页面。

- **工作台 UI/UX 重构**：简洁双栏布局、固定应用区、分组高级设置、项目/方案历史子页与只读预览；加入草稿放弃确认、弹窗焦点管理和键盘导航。五语言、深浅主题、完整预览、继承配置和历史方案提示均保留。写入较慢时不再提前解锁，避免重复提交。
- **方案版本 · v0.4.0**: 历史快照保留原有模型、思考等级和子 Agent 参数，不随新版推荐变动。 确认后只载入预览，不会立即写入配置。
- **GPT-6 快捷方案**：内置方案与新用户任务推荐改用 GPT-6 Luna / Sol / Astra；日常开发使用 GPT-6 Luna。思考等级和并发数不变，不自动覆盖已有项目配置、历史或已保存的任务偏好。Release 标题仅显示版本标签，开发版显示 `nightly`。
- **GPT-6 模型列表更新**：主模型、默认子 Agent 和当前任务的共用列表新增 `gpt-6-sol`、`gpt-6-luna`，与 `gpt-6-astra` 一起置顶；保留 GPT-5.6 系列并补充 `gpt-5.5`。本次只扩充可选模型，不自动替换现有方案、已保存的模型或思考等级，“未设置／继承”和自定义模型入口保持不变。
- **历史记录标签页**：项目配置历史移入独立标签页，支持按项目、路径或模型搜索、恢复和逐条删除。删除需二次确认，不修改项目配置或备份。README 移除了面向维护者的自动发布说明。
- 🧭 **左右双栏工作区**：左侧专注配置选择，右侧固定作用域、差异预览、二次确认与应用操作，显著缩短页面。
- 🎨 **主题与历史**：新增深/浅/系统主题、5 套强调色，以及跨 A/B/C 项目的配置历史与恢复。
- 🧯 **修复应用卡死/崩溃**：写入移到后台阻塞线程，增加防重复提交、超时解锁、串行写锁与安全临时文件写入。
- 🎯 **当前任务快速切换**：新增小修复 / 日常开发 / 复杂问题 / 架构设计 4 类任务模式。每类都可手动选择模型与 Reasoning、支持自定义模型 ID、本机记忆偏好，并可一键恢复进入任务模式前的模型设置。
- 🌐 **多语言界面**：新增简体中文、繁體中文、English、日本語、한국어；首次启动自动跟随系统/浏览器语言，也可在界面中手动切换并记住选择。
- 🚀 **一键正式发布**：Release 工作流可自动计算版本号、更新 Tauri / npm / Cargo 版本、构建三端、创建 Tag，并把安装包上传到 GitHub Release。
- 📦 **完整三端产物**：Windows 提供 NSIS `.exe`，Linux 提供 `.AppImage` 与 `.deb`，macOS 提供 Universal `.dmg`。
- ⚡ **CI 构建优化**：加入 `package-lock.json` / `Cargo.lock`、npm cache、Rust cache、Linux Tauri bundler cache、前端预检与过期构建自动取消。
- 🛡️ **配置安全**：继续支持全局/项目级 Codex 配置、逐项继承、安全备份、历史备份与原始配置恢复。

## 繁體中文

- 🧠 **GPT-6.1 角色分層方案定版**：新增 `2026-10-03` 目前方案版本並完整封存 v0.6.1 方案。Token Saver / Economy 降低 Plan Mode 消耗；Balanced 維持 GPT-6.1 Sol + Luna 執行；Astra Director 升級為 GPT-6 Astra high/xhigh 負責規劃與 Review、GPT-6.1 Sol medium 負責複雜執行；Max Quality 升級為 GPT-6 Astra xhigh + GPT-6.1 Sol high。既有專案與歷史方案不會自動遷移。
- 🔔 **主動自動檢查穩定版更新**：啟動後會在簽名 Updater 就緒後自動檢查最新穩定版，發現新版本時主動提示；應用持續執行時每 6 小時背景複查，休眠/切回應用且檢查已過期時也會補查。同一版本的主動提醒 24 小時內最多一次，手動「檢查更新」仍會立即回饋；自動檢查失敗不會跳出錯誤打擾使用。
- 🧠 **GPT-6.1 Sol 與方案版本化**：均衡方案與「複雜問題」預設升級為 GPT-6.1 Sol；GPT-6（v0.5.0）與 v0.4.0 方案繼續以不可變歷史快照保留。瀏覽歷史方案不會改寫目前設定，既有專案也不會被自動遷移。
- 🎚️ **依模型能力限制 Reasoning**：已知官方模型只顯示 Codex 官方 `models.json` 宣告支援的思考等級。讀取舊設定或自訂模型時仍保留原值；只有使用者主動切換到已知官方模型且舊等級不相容時，才使用該模型的官方預設 Reasoning，避免產生新的無效組合。
- 🧩 **Codex 用戶端相容性提示**：Config Health 會讀取官方模型目錄中的 `minimal_client_version`，把目前主模型/子 Agent 與本機 Codex CLI 版本比較。用戶端過舊時只顯示唯讀警告，不會隱藏模型、阻止儲存、自動升級 Codex 或改寫設定。
- 🩺 **環境狀態中心**：Config Health 現在統一顯示 Codex CLI、官方設定 Schema、官方模型目錄與簽名 Updater 狀態，區分最新、快取/較舊與無法使用，並顯示最近更新時間；所有狀態都只是唯讀診斷。
- 🔎 **Schema 規則級差異說明**：官方 Schema 更新後，變更欄位除了 `+ / - / ~`，還會進一步說明型別、預設值、列舉、required 或其他驗證規則的變化；未知/未來欄位仍預設保留，不會自動刪除。
- 📐 **Agent 效率指標**：Agent 分析新增每角色平均 Token/工作階段、平均 Token/輪次、平均 Token/回應，用於觀察資源消耗結構；這些數值不會被解讀為品質評分。
- 🧭 **專案級 Agent 摘要**：專案總覽直接顯示 Root Agent 與 Sub-agent 的 Token 和工作階段分布，並可一鍵進入專案用量詳情；摘要重用既有單次 rollout 掃描，不會額外重複掃描歷史。

- ⚡ **Service Tier 遙測與 Fast 參考成本**：本機 rollout 中已持久化的 thread settings 現在會作為 service tier 證據；精確回應依「模型 × tier」歸屬。目前 Codex 的 `priority` 會識別為 Fast，且只有官方費率明確提供模型倍率時才計入 Fast 附加成本。缺少 tier 證據、Flex/未知 tier 或 Fast 倍率不明時會標記為近似值；不會猜測長上下文、區域處理或未知模型價格。
- 🤖 **官方模型目錄自動更新**：主模型、預設子 Agent 與目前任務的候選模型會讀取 OpenAI Codex 官方 `models.json`，只採用官方標記為可列出的模型，並依官方優先順序排列。本機快取 24 小時；離線或更新失敗時繼續使用最近快取與內建相容清單。不會自動遷移既有設定、任務偏好、歷史、Preset 或自訂模型 ID。
- 🧾 **Release 建置來源證明**：正式發佈現在會為最終安裝檔、更新簽名、`latest.json` 與 `SHA256SUMS.txt` 建立 GitHub artifact attestation。可使用 `gh attestation verify <檔案> --repo While-Shark/codex-config-studio` 驗證檔案確實由本儲存庫 Release workflow 建置。此證明與 Windows/macOS 平台簽名及 Tauri updater 簽名彼此獨立、互相補充。
- 📈 **可解釋用量異常提示**：專案用量頁現在會標記明顯的每日 Token 突增。只使用精確逐回應資料；至少需要 3 個歷史活躍日，以最近最多 7 個精確活躍日中位數為基線，基線至少 10K Token 且當天達到 2.5× 以上才提示。舊版估算資料不會觸發，且此提示不評價模型品質，也不是帳單警報。
- 🧭 **設定健康與官方 schema 變更中心**：優先使用 OpenAI Codex 儲存庫產生的權威設定 schema，並安全快取最近可信版本；未知/未來欄位預設保留，只有 schema 足夠新且可信時才會提供未知欄位清理提示，清理前必須確認並備份。設定健康頁亦會顯示本機 Codex CLI 版本，並摘要權威 schema 的新增、移除與結構變更欄位。
- 📊 **專案用量、趨勢與參考成本**：以唯讀方式分析本機 Codex rollout JSONL，支援 7 天 / 30 天 / 全期間、模型與 Reasoning 分布、主工作階段/子 Agent、每日與模型趨勢、Agent 分析、可觀測 reroute 時間線、近期專案總覽與版本化參考成本。舊格式資料會明確標記估算；未知模型不猜價格；所有數值都是 best-effort 本機遙測，不是正式帳單。
- 🔒 **Model Integrity 執行階段核驗**：可依作用域鎖定有效模型與 Reasoning、偵測 Studio 可見設定偏移，並與本機 rollout 已記錄的執行階段證據比對。介面會顯示最近主工作階段的實際模型/Reasoning、reroute 次數、最近 5 筆證據，並支援唯讀手動重新整理。僅 CLI 臨時覆寫、未被本機記錄的行為與不可觀測的服務端內部路由仍不在本機保證範圍內。

- 🔄 **穩定版更新與簽名原地升級**：應用會檢查 GitHub 最新穩定版；正式簽名建置可在應用內下載、驗證簽名並安裝更新，Windows 使用 NSIS，Linux 依 AppImage / deb 安裝來源配對更新包，macOS 使用簽名更新包並於安裝後重新啟動。`v0.5.0` 尚未包含 Updater，因此升級到 `v0.6.0` 需先從 GitHub Releases 手動安裝一次；從 `v0.6.0` 開始才具備後續簽名原地升級能力。Nightly / 本機未簽名建置仍會回退到 GitHub Release 頁面。

- **工作台 UI/UX 重構**：簡潔雙欄佈局、固定套用區、分組進階設定、專案/方案歷史分頁與唯讀預覽；新增放棄草稿確認、對話框焦點管理與鍵盤導覽。保留五語言、深淺主題、繼承設定與舊方案提示。寫入完成前不會提前解鎖。
- **方案版本 · v0.4.0**: 歷史快照保留原有模型、思考等級與子 Agent 參數，不隨新版推薦變動。 確認後只載入預覽，不會立即寫入設定。
- **GPT-6 快捷方案**：內建方案與新使用者任務推薦改用 GPT-6 Luna / Sol / Astra；日常開發使用 GPT-6 Luna。思考等級與並行數不變，不自動覆寫既有專案設定、歷史或已儲存的任務偏好。Release 標題只顯示版本標籤，開發版顯示 `nightly`。
- **GPT-6 模型清單更新**：主模型、預設子 Agent 與目前任務共用清單新增 `gpt-6-sol`、`gpt-6-luna`，與 `gpt-6-astra` 一起置頂；保留 GPT-5.6 系列並補上 `gpt-5.5`。本次只擴充可選模型，不自動替換既有方案、已儲存的模型或思考等級，「未設定／繼承」與自訂模型入口保持不變。
- **歷史記錄分頁**：專案設定歷史移至獨立分頁，可依專案、路徑或模型搜尋、還原及逐筆刪除。刪除需再次確認，不修改專案設定或備份。README 移除了維護者用的自動發佈說明。
- 🎯 **目前任務快速切換**：新增小修復 / 日常開發 / 複雜問題 / 架構設計 4 類任務模式。每類都可手動選擇模型與 Reasoning、支援自訂模型 ID、本機記憶偏好，並可一鍵恢復進入任務模式前的模型設定。
- 🌐 **多語言介面**：新增简体中文、繁體中文、English、日本語、한국어；首次啟動會自動依系統/瀏覽器語言選擇，也可手動切換並記住選擇。
- 🚀 **一鍵正式發佈**：Release 工作流程可自動計算版本號、更新 Tauri / npm / Cargo 版本、建置三端、建立 Tag，並將安裝檔上傳到 GitHub Release。
- 📦 **完整三端產物**：Windows 提供 NSIS `.exe`，Linux 提供 `.AppImage` 與 `.deb`，macOS 提供 Universal `.dmg`。
- ⚡ **CI 建置優化**：加入 `package-lock.json` / `Cargo.lock`、npm cache、Rust cache、Linux Tauri bundler cache、前端預檢與自動取消過期建置。
- 🛡️ **設定安全**：持續支援全域/專案級 Codex 設定、逐項繼承、安全備份、歷史備份與原始設定還原。

## English

- 🧠 **Finalized GPT-6.1 role-based profiles**: Added a new `2026-10-03` current profile revision while preserving the exact v0.6.1 profiles as an immutable archive. Token Saver and Economy reduce Plan Mode spend; Balanced remains GPT-6.1 Sol + Luna; Astra Director now uses GPT-6 Astra high/xhigh for planning/review with GPT-6.1 Sol medium workers; Max Quality now pairs GPT-6 Astra xhigh with GPT-6.1 Sol high. Existing projects and archived profiles are never migrated automatically.
- 🔔 **Proactive automatic stable-update checks**: After startup, the app waits for signed-updater readiness and then checks the latest stable release automatically. A newer release is surfaced proactively; long-running sessions recheck every 6 hours, and returning to the app after a stale interval triggers another check. The same version prompts at most once per 24 hours, manual checks remain immediate, and automatic failures stay non-intrusive.
- 🧠 **GPT-6.1 Sol and versioned profiles**: Balanced and Complex Problem defaults now use GPT-6.1 Sol. The GPT-6 (v0.5.0) and v0.4.0 profile sets remain immutable archive snapshots. Browsing archived profiles never rewrites current configuration, and existing projects are not migrated automatically.
- 🎚️ **Model-aware Reasoning choices**: Known official models now expose only the reasoning levels declared by Codex `models.json`. Existing/custom values remain intact when loading configuration; only an explicit switch to a known official model reconciles an incompatible value to that model's official default, avoiding newly created invalid combinations.
- 🧩 **Codex client compatibility warnings**: Config Health reads `minimal_client_version` from the official model catalog and compares effective main/sub-agent models with the detected local Codex CLI version. An older client gets a read-only warning only—models are not hidden, Apply is not blocked, Codex is not upgraded automatically, and configuration is not rewritten.
- 🩺 **Environment status center**: Config Health now presents Codex CLI, the official config schema, the official model catalog, and signed-updater readiness in one place, distinguishing current, cached/stale, and unavailable states with last-updated timestamps. All of this is read-only diagnostics.
- 🔎 **Rule-level schema diff explanations**: Changed official schema fields no longer stop at `+ / - / ~`; the UI explains type, default, enum, required-field, or other validation-rule changes. Unknown/future config remains preserved by default and is never removed automatically.
- 📐 **Agent efficiency metrics**: Agent analysis now includes average tokens per session, turn, and response for each role. These are resource-consumption metrics only, not model- or agent-quality scores.
- 🧭 **Project-level agent summary**: Project cards now show Root Agent versus Sub-agent token and session splits before opening the detailed usage view. The summary reuses the existing single rollout scan rather than adding another per-project history scan.

- ⚡ **Service-tier telemetry and Fast reference cost**: Durable thread-settings events in local rollout history now provide service-tier evidence, with exact responses attributed by model × tier. Current Codex `priority` is recognized as Fast, and a Fast surcharge is applied only when the official rate card documents a model-specific multiplier. Missing tier evidence, Flex/unknown tiers, or undocumented Fast multipliers keep the result approximate; long-context, regional-processing, and unknown-model pricing are never guessed.
- 🤖 **Official model-catalog refresh**: Main-model, default sub-agent, and Current Task choices now read the official OpenAI Codex `models.json` catalog, accept only models marked visible for listing, and follow official priority ordering. The catalog is cached locally for 24 hours; offline/failed refreshes keep the latest cache and built-in compatibility list. Existing configuration, task preferences, history, presets, and custom model IDs are never migrated automatically.
- 🧾 **Release build provenance**: Formal releases now create GitHub artifact attestations for final installers, updater signatures, `latest.json`, and `SHA256SUMS.txt`. Verify a downloaded file with `gh attestation verify <file> --repo While-Shark/codex-config-studio` to confirm it was produced by this repository's Release workflow. This provenance is independent from and complementary to Windows/macOS platform signing and Tauri updater signing.
- 📈 **Explainable usage anomaly hints**: The project usage view now flags clear daily token spikes using exact response telemetry only. It requires at least 3 prior active days, uses the median of up to 7 exact active days as baseline, requires a baseline of at least 10K tokens, and flags only days at 2.5× or above. Legacy estimates never trigger it; this is neither a model-quality judgment nor a billing alert.
- 🧭 **Config Health and authoritative schema change center**: Prefer the generated authoritative schema from the OpenAI Codex repository and safely cache the latest trusted copy. Unknown/future fields are preserved by default; cleanup suggestions only come from sufficiently fresh trusted schema data and require confirmation plus backup. Config Health also shows the detected local Codex CLI version and summarizes added, removed, and structurally changed fields across authoritative schema revisions.
- 📊 **Project usage, trends, and reference cost**: Read-only analysis of local Codex rollout JSONL with 7-day / 30-day / all-time views, model and reasoning breakdowns, root/sub-agent usage, daily and per-model trends, agent analysis, observable reroute history, recent-project overview, and versioned reference-cost estimates. Legacy-only data is explicitly estimated, unknown-model pricing is never invented, and all values are best-effort local telemetry rather than billing data.
- 🔒 **Runtime Model Integrity verification**: Lock the effective model/reasoning target per scope, detect Studio-visible config drift, and compare it with runtime evidence already recorded in local rollout files. The UI shows the latest observed model/reasoning, reroute count, five recent evidence entries, and a read-only refresh action. CLI-only temporary overrides, behavior not recorded locally, and unobservable server-side routing remain outside the local guarantee.

- 🔄 **Stable update checks and signed in-place upgrades**: The app checks the latest stable GitHub release. Formal signed builds can download, verify, and install updates in-app: NSIS on Windows, installer-matched AppImage/deb packages on Linux, and signed updater bundles on macOS with restart after installation. `v0.5.0` predates the updater, so moving to `v0.6.0` requires one manual install from GitHub Releases; `v0.6.0` becomes the first baseline capable of later signed in-place upgrades. Unsigned Nightly/local builds keep the GitHub Release-page fallback.

- **Workspace UI/UX redesign**: Clean split layout, pinned apply controls, grouped advanced settings, project/profile history views and read-only previews. Added unsaved-draft confirmation, accessible modal focus handling and keyboard tabs. Preserved five languages, themes, complete configuration previews, inheritance and archived-profile warnings. Slow writes keep their lock until the native operation actually finishes.
- **Profile version · v0.4.0**: Archived snapshots retain their original models, reasoning levels and sub-agent settings; new recommendations never rewrite them. Confirming only loads a preview; it does not write configuration.
- **GPT-6 presets**: Built-in profiles and fresh task recommendations now use GPT-6 Luna / Sol / Astra; Daily uses GPT-6 Luna. Reasoning and concurrency are unchanged. Existing project files, history and saved task preferences are not migrated. Release titles show only the version tag; development builds use `nightly`.
- **GPT-6 model catalog update**: Added `gpt-6-sol` and `gpt-6-luna` to the shared main-model, default sub-agent and current-task selectors, alongside `gpt-6-astra` at the top. Retained the GPT-5.6 family and added `gpt-5.5`. This only expands the choices; existing presets, saved models, reasoning levels, unset/inherit and custom model IDs remain unchanged.
- **History tab**: Project configuration history now has a dedicated tab with project/path/model search, restore, and per-entry deletion. Deletion requires confirmation and preserves configuration and backups. Maintainer release instructions were removed from the READMEs.
- 🧭 **Two-column workspace**: Configuration stays on the left while scope, diff review, confirmation, apply actions, and history stay visible on the right.
- 🎨 **Themes and history**: Added system/dark/light themes, five accent colors, and cross-project A/B/C configuration history with restore.
- 🧯 **Apply freeze/crash hardening**: Writes now run off the UI thread with duplicate-submit protection, timeout recovery, a serialized write lock, and safer temporary-file writes.
- 🎯 **Current Task quick switching**: Added Quick Fix / Daily Development / Complex Problem / Architecture modes. Every mode supports manual model + reasoning selection, custom model IDs, locally remembered preferences, and one-click restoration of the pre-task model baseline.
- 🌐 **Multilingual UI**: Added Simplified Chinese, Traditional Chinese, English, Japanese, and Korean. The app follows the system/browser language on first launch and remembers manual language changes.
- 🚀 **One-click formal releases**: The Release workflow can calculate the next version, update Tauri/npm/Cargo versions, build all desktop targets, create the Git tag, and upload installers to GitHub Releases automatically.
- 📦 **Complete cross-platform artifacts**: Windows NSIS `.exe`, Linux `.AppImage` + `.deb`, and macOS Universal `.dmg`.
- ⚡ **Faster CI**: Added npm/Cargo lockfiles, npm cache, Rust cache, Linux Tauri bundler cache, frontend preflight checks, and automatic cancellation of obsolete builds.
- 🛡️ **Safe configuration management**: Global/project Codex scopes, per-field inheritance, original backups, history backups, and restore support remain included.

## 日本語

- 🧠 **GPT-6.1 の役割分担プロファイルを正式化**：`2026-10-03` の現行版を追加し、v0.6.1 のプロファイルを不変の履歴として保存しました。Token Saver / Economy は Plan Mode コストを抑え、Balanced は GPT-6.1 Sol + Luna を維持。Astra Director は GPT-6 Astra high/xhigh が計画と Review、GPT-6.1 Sol medium が複雑な実装を担当し、Max Quality は GPT-6 Astra xhigh + GPT-6.1 Sol high に更新します。既存プロジェクトや履歴設定は自動移行しません。
- 🔔 **安定版の自動・能動チェック**：起動後、署名付き Updater の準備完了を待って最新安定版を自動確認し、新版があれば能動的に通知します。長時間起動中は 6 時間ごとに再確認し、スリープ復帰やアプリへ戻った際に前回確認が古ければ再チェックします。同じ版の自動通知は 24 時間に 1 回までで、手動確認は常に即時実行され、自動確認の失敗は作業を妨げません。
- 🧠 **GPT-6.1 Sol とプロファイルの版管理**：Balanced と「複雑な問題」の既定値を GPT-6.1 Sol に更新しました。GPT-6（v0.5.0）と v0.4.0 は不変の履歴スナップショットとして保持します。履歴プロファイルを閲覧しても現在の設定は書き換えず、既存プロジェクトも自動移行しません。
- 🎚️ **モデル能力に応じた Reasoning**：既知の公式モデルでは Codex 公式 `models.json` が宣言する思考レベルだけを表示します。既存設定やカスタムモデルの値は読み込み時に保持し、既知の公式モデルへ明示的に切り替えたときだけ、非対応の値をそのモデルの公式既定 Reasoning に調整します。
- 🧩 **Codex クライアント互換性警告**：Config Health は公式モデルカタログの `minimal_client_version` を読み、現在のメイン/サブ Agent とローカル Codex CLI の版を比較します。古いクライアントには読み取り専用の警告だけを表示し、モデル非表示、保存停止、自動アップグレード、設定書き換えは行いません。
- 🩺 **環境ステータスセンター**：Config Health に Codex CLI、公式設定 Schema、公式モデルカタログ、署名付き Updater の状態をまとめ、最新・キャッシュ/古い・利用不可を区別し、最終更新時刻も表示します。すべて読み取り専用の診断です。
- 🔎 **Schema ルール差分の説明**：公式 Schema 更新時、変更フィールドは `+ / - / ~` だけでなく、型・既定値・enum・required・その他検証ルールの変化まで表示します。未知/将来フィールドは引き続き既定で保持し、自動削除しません。
- 📐 **Agent 効率メトリクス**：Agent 分析にロール別の平均 Token/セッション、平均 Token/ターン、平均 Token/応答を追加しました。これは資源消費の観測値であり、品質スコアではありません。
- 🧭 **プロジェクト別 Agent 要約**：プロジェクト概要カードで Root Agent / Sub-agent の Token とセッション比率を確認してから詳細使用量へ移動できます。既存の単一 rollout 走査を再利用し、追加の履歴走査は行いません。

- ⚡ **Service Tier テレメトリと Fast 参考コスト**：ローカル rollout に永続化された thread settings を service tier 証拠として使い、正確な応答を「モデル × tier」で帰属します。現在の Codex の `priority` は Fast として認識し、公式レートカードにモデル別倍率が明記されている場合だけ Fast 追加コストを反映します。tier 証拠不足、Flex/未知 tier、倍率不明の場合は概算扱いとし、長文脈・地域処理・未知モデル価格は推測しません。
- 🤖 **公式モデルカタログの自動更新**：メインモデル、既定のサブ Agent、現在のタスクの候補を OpenAI Codex 公式 `models.json` から取得し、公式に一覧表示対象とされたモデルだけを優先順位どおりに使用します。24 時間ローカルキャッシュし、オフライン時や更新失敗時は最新キャッシュと内蔵互換リストを継続使用します。既存設定、タスク設定、履歴、Preset、カスタムモデル ID は自動移行しません。
- 🧾 **Release ビルドの来歴証明**：正式 Release では、最終インストーラー、更新署名、`latest.json`、`SHA256SUMS.txt` に GitHub artifact attestation を作成します。`gh attestation verify <file> --repo While-Shark/codex-config-studio` で、本リポジトリの Release workflow が生成したファイルであることを検証できます。これは Windows/macOS のプラットフォーム署名や Tauri updater 署名とは独立した補完的な証明です。
- 📈 **説明可能な使用量異常ヒント**：プロジェクト使用量画面で、明確な日次 Token 急増を表示します。正確な応答データだけを使い、過去のアクティブ日が少なくとも 3 日必要です。直近最大 7 日の正確なアクティブ日の中央値を基準とし、基準値が 10K Token 以上かつ当日が 2.5× 以上の場合だけ表示します。旧形式の推定値は発火せず、モデル品質評価や請求アラートでもありません。
- 🧭 **Config Health と公式 schema 変更センター**：OpenAI Codex リポジトリで生成された公式 schema を優先し、最後に信頼できた版を安全にキャッシュします。未知/将来フィールドは既定で保持し、十分に新しく信頼できる schema の場合だけ削除候補を提示し、削除前には確認とバックアップが必要です。ローカル Codex CLI の版と、公式 schema 間の追加・削除・構造変更フィールドも表示します。
- 📊 **プロジェクト使用量・傾向・参考コスト**：ローカル Codex rollout JSONL を読み取り専用で分析し、7 日 / 30 日 / 全期間、モデル/Reasoning、ルート/サブ Agent、日次/モデル別傾向、Agent 分析、観測可能な reroute 履歴、最近のプロジェクト概要、版管理された参考コストを表示します。旧形式のみのデータは推定と明示し、未知モデルの価格は推測しません。すべて best-effort のローカルテレメトリであり、請求データではありません。
- 🔒 **Model Integrity の実行時検証**：スコープごとに有効モデル/Reasoning をロックし、Studio から見える設定ドリフトを検出し、ローカル rollout に記録済みの実行時証拠と照合します。最新モデル/Reasoning、reroute 数、最近 5 件の証拠を表示し、読み取り専用で再取得できます。CLI の一時上書き、ローカルに記録されない挙動、観測不能なサーバー内部ルーティングは保証対象外です。

- 🔄 **安定版チェックと署名付きアプリ内更新**：GitHub の最新安定版を確認し、正式な署名付きビルドではアプリ内で更新をダウンロード、署名検証、インストールできます。Windows は NSIS、Linux は AppImage / deb のインストール元に一致する更新パッケージ、macOS は署名付き更新パッケージを使用し、インストール後に再起動します。`v0.5.0` には Updater が含まれていないため、`v0.6.0` への移行は GitHub Releases から一度手動インストールする必要があります。`v0.6.0` 以降が後続の署名付きアプリ内更新の基準になります。

- **UI/UX を刷新**：二列レイアウト、固定適用ボタン、設定のグループ化、プロジェクト/プロファイル履歴と読み取り専用プレビュー。草稿破棄の確認、フォーカス管理、キーボード操作を追加。多言語、テーマ、継承と履歴警告を維持し、書き込み完了前のロック解除を防止。
- **プロファイルの版 · v0.4.0**: 履歴には元のモデル、思考レベル、サブ Agent 設定を保存し、新しい推奨値で上書きしません。 確認後はプレビューのみで、設定は書き込みません。
- **GPT-6 プロファイル**：内蔵設定と新規タスクの推奨値を GPT-6 Luna / Sol / Astra へ更新し、日常開発は GPT-6 Luna を使用します。思考レベルと並列数は変更せず、既存の設定・履歴・保存済み選択を上書きしません。Release タイトルはバージョンタグのみ、開発版は `nightly` と表示します。
- **GPT-6 モデル一覧を更新**：メインモデル、既定のサブ Agent、現在のタスクで共有する一覧に `gpt-6-sol` と `gpt-6-luna` を追加し、`gpt-6-astra` とともに先頭へ配置しました。GPT-5.6 系列は保持し、`gpt-5.5` も追加しました。選択肢のみの追加で、既存プロファイル、保存済みモデル、思考レベル、未設定／継承、カスタムモデル ID は変更しません。
- **履歴タブ**：プロジェクト設定の履歴を専用タブに移動し、プロジェクト・パス・モデルの検索、復元、個別削除に対応しました。削除には確認が必要で、設定とバックアップは保持します。README から管理者向けリリース手順を削除しました。
- 🎯 **現在のタスク切り替え**：小さな修正 / 日常開発 / 複雑な問題 / アーキテクチャの 4 モードを追加。モデルと思考レベルを手動選択でき、カスタムモデル ID、ローカル設定保存、タスク開始前へのワンクリック復元に対応しました。
- 🌐 **多言語 UI**：簡体字中国語、繁体字中国語、英語、日本語、韓国語を追加。初回起動時はシステム/ブラウザー言語に自動追従し、手動変更も保存されます。
- 🚀 **ワンクリック正式リリース**：Release ワークフローが次のバージョン計算、Tauri/npm/Cargo のバージョン更新、3 プラットフォームのビルド、Tag 作成、GitHub Release への成果物アップロードまで自動化します。
- 📦 **クロスプラットフォーム成果物**：Windows は NSIS `.exe`、Linux は `.AppImage` + `.deb`、macOS は Universal `.dmg` を提供します。
- ⚡ **CI 高速化**：npm/Cargo lockfile、npm cache、Rust cache、Linux Tauri bundler cache、フロントエンド事前チェック、古いビルドの自動キャンセルを追加しました。
- 🛡️ **安全な設定管理**：グローバル/プロジェクト設定、項目単位の継承、元設定バックアップ、履歴バックアップ、復元機能を引き続き提供します。

## 한국어

- 🧠 **GPT-6.1 역할 기반 프로필 확정**: `2026-10-03` 현재 프로필 버전을 추가하고 v0.6.1 프로필은 변경 불가능한 기록으로 보존합니다. Token Saver / Economy는 Plan Mode 비용을 낮추고, Balanced는 GPT-6.1 Sol + Luna를 유지합니다. Astra Director는 GPT-6 Astra high/xhigh가 계획과 Review를 담당하고 GPT-6.1 Sol medium이 복잡한 실행을 맡으며, Max Quality는 GPT-6 Astra xhigh + GPT-6.1 Sol high로 업그레이드됩니다. 기존 프로젝트와 기록 프로필은 자동 마이그레이션하지 않습니다.
- 🔔 **안정 버전 자동·능동 업데이트 확인**: 시작 후 서명 Updater 준비 상태를 확인한 다음 최신 안정 버전을 자동으로 검사하고, 새 버전이 있으면 능동적으로 알립니다. 앱을 오래 실행하면 6시간마다 다시 확인하며, 절전 복귀나 앱으로 돌아왔을 때 이전 확인이 오래되었으면 재검사합니다. 같은 버전의 자동 알림은 24시간에 한 번으로 제한하고, 수동 확인은 항상 즉시 실행되며 자동 확인 실패는 사용을 방해하지 않습니다.
- 🧠 **GPT-6.1 Sol 및 버전형 프로필**: Balanced와 복잡한 문제 기본값을 GPT-6.1 Sol로 업그레이드했습니다. GPT-6(v0.5.0)와 v0.4.0 프로필은 변경되지 않는 기록 스냅샷으로 계속 보존합니다. 기록 프로필을 탐색해도 현재 설정을 다시 쓰지 않으며 기존 프로젝트를 자동 마이그레이션하지 않습니다.
- 🎚️ **모델 능력 기반 Reasoning 선택**: 알려진 공식 모델에는 Codex 공식 `models.json`이 지원한다고 선언한 사고 수준만 표시합니다. 기존 설정과 사용자 지정 모델 값은 읽을 때 그대로 유지하며, 사용자가 알려진 공식 모델로 명시적으로 전환했고 기존 수준이 호환되지 않을 때만 해당 모델의 공식 기본 Reasoning으로 조정합니다.
- 🧩 **Codex 클라이언트 호환성 경고**: Config Health가 공식 모델 카탈로그의 `minimal_client_version`을 읽고 현재 메인/서브 Agent 모델과 로컬 Codex CLI 버전을 비교합니다. 클라이언트가 오래된 경우 읽기 전용 경고만 표시하며, 모델을 숨기거나 Apply를 막거나 Codex를 자동 업그레이드하거나 설정을 다시 쓰지 않습니다.
- 🩺 **환경 상태 센터**: Config Health에서 Codex CLI, 공식 설정 Schema, 공식 모델 카탈로그, 서명 Updater 상태를 한곳에 표시하고 최신, 캐시/오래됨, 사용 불가를 구분하며 최근 업데이트 시각도 제공합니다. 모두 읽기 전용 진단입니다.
- 🔎 **Schema 규칙 수준 변경 설명**: 공식 Schema가 바뀌면 `+ / - / ~`만 보여주지 않고 타입, 기본값, enum, required 또는 기타 검증 규칙의 변경 내용까지 설명합니다. 알 수 없거나 미래에 추가될 필드는 계속 기본 보존하며 자동 삭제하지 않습니다.
- 📐 **Agent 효율 지표**: Agent 분석에 역할별 평균 Token/세션, 평균 Token/턴, 평균 Token/응답을 추가했습니다. 이는 자원 사용 구조를 보는 지표이며 품질 점수가 아닙니다.
- 🧭 **프로젝트별 Agent 요약**: 프로젝트 개요 카드에서 Root Agent와 Sub-agent의 Token 및 세션 분포를 바로 확인한 뒤 상세 사용량으로 이동할 수 있습니다. 기존 단일 rollout 스캔을 재사용하며 프로젝트별 추가 재스캔은 하지 않습니다.

- ⚡ **Service Tier 텔레메트리와 Fast 참고 비용**: 로컬 rollout에 영구 저장된 thread settings를 service tier 증거로 사용하고 정확한 응답을 모델 × tier로 귀속합니다. 현재 Codex의 `priority`를 Fast로 인식하며 공식 요금표에 모델별 배율이 명시된 경우에만 Fast 추가 비용을 반영합니다. tier 증거 부족, Flex/알 수 없는 tier, 배율 미확인 상태는 근사값으로 처리하며 장문맥·지역 처리·알 수 없는 모델 가격은 추측하지 않습니다.
- 🤖 **공식 모델 카탈로그 자동 새로고침**: 메인 모델, 기본 서브 Agent, 현재 작업의 모델 후보를 OpenAI Codex 공식 `models.json`에서 읽고 공식적으로 목록 표시가 허용된 모델만 우선순위에 따라 사용합니다. 24시간 로컬 캐시하며 오프라인이나 새로고침 실패 시 최근 캐시와 내장 호환 목록을 계속 사용합니다. 기존 설정, 작업 선호, 기록, Preset, 사용자 지정 모델 ID는 자동 마이그레이션하지 않습니다.
- 🧾 **Release 빌드 출처 증명**: 정식 릴리스는 최종 설치 파일, 업데이트 서명, `latest.json`, `SHA256SUMS.txt`에 GitHub artifact attestation을 생성합니다. `gh attestation verify <file> --repo While-Shark/codex-config-studio`로 해당 파일이 이 저장소의 Release workflow에서 만들어졌는지 검증할 수 있습니다. 이 provenance는 Windows/macOS 플랫폼 서명 및 Tauri updater 서명과 독립적이며 서로 보완합니다.
- 📈 **설명 가능한 사용량 이상 힌트**: 프로젝트 사용량 화면에서 뚜렷한 일별 Token 급증을 표시합니다. 정확한 응답 데이터만 사용하며 이전 활성일이 최소 3일 필요합니다. 최근 최대 7개의 정확한 활성일 중앙값을 기준으로, 기준이 10K Token 이상이고 당일이 2.5× 이상일 때만 표시합니다. 구형 추정 데이터는 경고를 만들지 않으며 모델 품질 평가나 청구 경고가 아닙니다.
- 🧭 **Config Health 및 권위 schema 변경 센터**: OpenAI Codex 저장소에서 생성된 권위 있는 schema를 우선 사용하고 마지막으로 신뢰한 버전을 안전하게 캐시합니다. 알 수 없거나 미래의 필드는 기본 보존하며, 충분히 최신이고 신뢰 가능한 schema에서만 정리 후보를 제시하고 제거 전 확인과 백업을 요구합니다. 로컬 Codex CLI 버전과 권위 schema 사이의 추가/삭제/구조 변경 필드도 표시합니다.
- 📊 **프로젝트 사용량, 추세 및 참고 비용**: 로컬 Codex rollout JSONL을 읽기 전용으로 분석해 7일 / 30일 / 전체 기간, 모델/Reasoning, 루트/서브 Agent, 일별/모델별 추세, Agent 분석, 관찰 가능한 reroute 기록, 최근 프로젝트 개요, 버전이 있는 참고 비용을 제공합니다. 구형 형식 데이터는 추정값으로 명시하며 알 수 없는 모델 가격은 추측하지 않습니다. 모든 값은 best-effort 로컬 텔레메트리이며 청구 데이터가 아닙니다.
- 🔒 **Model Integrity 런타임 검증**: 범위별 유효 모델/Reasoning을 잠그고 Studio에서 보이는 설정 드리프트를 감지하며 로컬 rollout에 이미 기록된 런타임 증거와 비교합니다. 최근 모델/Reasoning, reroute 횟수, 최근 5개 증거를 표시하고 읽기 전용 새로고침을 제공합니다. CLI 임시 재정의, 로컬에 기록되지 않은 동작, 관찰할 수 없는 서버 내부 라우팅은 로컬 보장 범위 밖입니다.

- 🔄 **안정 버전 확인 및 서명된 인앱 업데이트**: GitHub 최신 안정 버전을 확인하고, 정식 서명 빌드에서는 앱 안에서 업데이트를 다운로드하고 서명을 검증한 뒤 설치할 수 있습니다. Windows는 NSIS, Linux는 설치 출처에 맞는 AppImage/deb 패키지, macOS는 서명된 업데이트 패키지를 사용하며 설치 후 재시작합니다. `v0.5.0`에는 Updater가 없으므로 `v0.6.0`으로 이동할 때는 GitHub Releases에서 한 번 수동 설치해야 하며, `v0.6.0`부터 이후 서명된 인앱 업데이트의 기준 버전이 됩니다.

- **UI/UX 개선**: 두 열 레이아웃, 고정 적용 영역, 설정 그룹, 프로젝트/프로필 기록 및 읽기 전용 미리보기. 초안 폐기 확인, 포커스 관리 및 키보드 탭 조작을 추가했습니다. 다국어, 테마, 상속, 보관 프로필 경고를 유지하며 쓰기 완료 전 잠금을 해제하지 않습니다.
- **프로필 버전 · v0.4.0**: 보관된 스냅샷은 원래 모델, 사고 수준 및 서브 Agent 설정을 유지하며 새 추천값으로 덮어쓰지 않습니다. 확인하면 미리보기만 불러오며 설정 파일에 쓰지 않습니다.
- **GPT-6 프로필**: 기본 프로필과 새 작업 추천을 GPT-6 Luna / Sol / Astra로 변경하고 일상 개발은 GPT-6 Luna를 사용합니다. 사고 수준과 동시 실행 수는 유지하며 기존 설정, 기록, 저장된 선호를 덮어쓰지 않습니다. Release 제목은 버전 태그만 표시하고 개발판은 `nightly`로 표시합니다.
- **GPT-6 모델 목록 업데이트**: 메인 모델, 기본 서브 Agent, 현재 작업에서 공유하는 목록에 `gpt-6-sol`과 `gpt-6-luna`를 추가하고 `gpt-6-astra`와 함께 상단에 배치했습니다. GPT-5.6 계열을 유지하고 `gpt-5.5`도 추가했습니다. 선택지만 확장하며 기존 프로필, 저장된 모델, 사고 수준, 미설정/상속 및 사용자 지정 모델 ID는 변경하지 않습니다.
- **기록 탭**: 프로젝트 설정 기록을 별도 탭으로 이동하고 프로젝트/경로/모델 검색, 복원 및 개별 삭제를 추가했습니다. 삭제 전 확인이 필요하며 설정과 백업은 유지됩니다. README에서 관리자용 릴리스 안내를 제거했습니다.
- 🎯 **현재 작업 빠른 전환**: 작은 수정 / 일상 개발 / 복잡한 문제 / 아키텍처 4개 모드를 추가했습니다. 모델과 사고 수준을 직접 선택하고 사용자 지정 모델 ID, 로컬 선호 저장, 작업 모드 이전 설정 복원을 지원합니다.
- 🌐 **다국어 UI**: 중국어 간체, 중국어 번체, 영어, 일본어, 한국어를 추가했습니다. 첫 실행 시 시스템/브라우저 언어를 자동 감지하며, 수동으로 선택한 언어도 저장됩니다.
- 🚀 **원클릭 정식 릴리스**: Release 워크플로가 다음 버전 계산, Tauri/npm/Cargo 버전 갱신, 3개 플랫폼 빌드, Tag 생성, GitHub Release에 설치 파일 업로드까지 자동으로 처리합니다.
- 📦 **완전한 멀티플랫폼 산출물**: Windows NSIS `.exe`, Linux `.AppImage` + `.deb`, macOS Universal `.dmg`를 제공합니다.
- ⚡ **CI 빌드 최적화**: npm/Cargo lockfile, npm cache, Rust cache, Linux Tauri bundler cache, 프론트엔드 사전 검사, 오래된 빌드 자동 취소를 추가했습니다.
- 🛡️ **안전한 설정 관리**: 전역/프로젝트 Codex 설정, 필드별 상속, 원본 백업, 히스토리 백업, 원본 복원 기능을 계속 제공합니다.
