use serde_json::Value;

enum AuthStyle {
    /// GET {base}/v1/models，Authorization: Bearer
    BearerV1,
    /// GET {base}/models，Authorization: Bearer
    BearerModels,
    /// GET {base}/v1/models，x-api-key + anthropic-version
    Anthropic,
    /// GET {base}/v1beta/models?key=KEY
    Gemini,
}

/// 主流服务商的校验端点；None 表示不支持在线校验
fn provider_base(provider: &str) -> Option<(&'static str, AuthStyle)> {
    match provider {
        "OpenAI" => Some(("https://api.openai.com", AuthStyle::BearerV1)),
        "DeepSeek" => Some(("https://api.deepseek.com", AuthStyle::BearerV1)),
        "Moonshot（月之暗面）" => Some(("https://api.moonshot.cn", AuthStyle::BearerV1)),
        "智谱AI" => Some(("https://open.bigmodel.cn/api/paas/v4", AuthStyle::BearerModels)),
        "通义千问" => Some((
            "https://dashscope.aliyuncs.com/compatible-mode",
            AuthStyle::BearerV1,
        )),
        "Anthropic" => Some(("https://api.anthropic.com", AuthStyle::Anthropic)),
        "Google Gemini" => Some((
            "https://generativelanguage.googleapis.com",
            AuthStyle::Gemini,
        )),
        "豆包（火山方舟）" => Some((
            "https://ark.cn-beijing.volces.com/api/v3",
            AuthStyle::BearerModels,
        )),
        "硅基流动" => Some(("https://api.siliconflow.cn", AuthStyle::BearerV1)),
        "OpenRouter" => Some(("https://openrouter.ai/api", AuthStyle::BearerV1)),
        "xAI（Grok）" => Some(("https://api.x.ai", AuthStyle::BearerV1)),
        "Mistral" => Some(("https://api.mistral.ai", AuthStyle::BearerV1)),
        "Cohere" => Some(("https://api.cohere.com", AuthStyle::BearerV1)),
        "百度千帆" => Some(("https://qianfan.baidubce.com/v2", AuthStyle::BearerModels)),
        "阶跃星辰" => Some(("https://api.stepfun.com", AuthStyle::BearerV1)),
        "360智脑" => Some(("https://api.360.cn", AuthStyle::BearerV1)),
        "讯飞星火" => Some(("https://spark-api-open.xf-yun.com/v1", AuthStyle::BearerModels)),
        // Azure OpenAI / 腾讯云混元 / Amazon Bedrock 等需额外资源参数，不做在线校验
        _ => None,
    }
}

/// 校验结果：(status, message)
/// status: "active" | "invalid" | "unknown"
pub async fn check_provider_key(provider: &str, api_key: &str) -> (String, String) {
    let (base, style) = match provider_base(provider) {
        Some(v) => v,
        None => {
            return (
                "unknown".to_string(),
                format!("服务商「{provider}」暂不支持在线校验"),
            )
        }
    };

    let client = match reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
    {
        Ok(c) => c,
        Err(e) => return ("unknown".to_string(), format!("网络请求失败: {e}")),
    };

    let resp = match style {
        AuthStyle::BearerV1 => client
            .get(format!("{base}/v1/models"))
            .bearer_auth(api_key)
            .send()
            .await,
        AuthStyle::BearerModels => client
            .get(format!("{base}/models"))
            .bearer_auth(api_key)
            .send()
            .await,
        AuthStyle::Anthropic => client
            .get(format!("{base}/v1/models"))
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .send()
            .await,
        AuthStyle::Gemini => client
            .get(format!("{base}/v1beta/models"))
            .query(&[("key", api_key)])
            .send()
            .await,
    };

    let resp = match resp {
        Ok(r) => r,
        Err(e) => return ("unknown".to_string(), format!("网络请求失败: {e}")),
    };

    let status = resp.status();
    if status.is_success() {
        return ("active".to_string(), "校验通过".to_string());
    }
    let body = resp.text().await.unwrap_or_default();
    let msg = serde_json::from_str::<Value>(&body)
        .ok()
        .and_then(|v| {
            v.get("error")
                .and_then(|e| e.get("message").and_then(|m| m.as_str()))
                .map(|s| s.to_string())
        })
        .unwrap_or_else(|| body.chars().take(200).collect());
    let detail = format!("HTTP {}: {}", status.as_u16(), msg);
    if status.as_u16() == 401 || status.as_u16() == 403 {
        ("invalid".to_string(), detail)
    } else {
        ("unknown".to_string(), detail)
    }
}
