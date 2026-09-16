## ADDED Requirements

### Requirement: Raycast 内单栏搜索

系统 SHALL 在 Raycast 内渲染四个 view 命令，展示单栏结果，不启动独立窗口，不显示右侧详情。

#### Scenario: 打开统一搜索

- **WHEN** 用户执行搜索浏览器
- **THEN** 原生列表展示来源筛选、结果数、标题、网址、来源和操作菜单

### Requirement: 保留匹配与原始记录

系统 SHALL 使用 text-search-engine 返回拼音命中范围，复制和跳转使用原始记录，按版本拒绝过期操作。

#### Scenario: 查询发生变化

- **WHEN** 新查询或刷新令旧结果失效
- **THEN** 旧结果不能再执行复制或跳转，分页只能合并当前查询结果

### Requirement: 明确高亮能力边界

系统 SHALL 区分 Clipboard History 的私有高亮组件与公开扩展 API，不得用括号、详情页或独立窗口冒充列表高亮。

#### Scenario: 公开接口未提供范围渲染

- **WHEN** 当前宿主没有可用的扩展行内高亮接口
- **THEN** 保留原文及匹配数据，并明确记录着色功能未完成
