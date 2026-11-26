use std::io::{Read, Write};

#[path = "../../strip-mdx-rs/src/port.rs"]
mod port;

use port::{LINE_END, js_space, replace_links, replace_sections, strip_line_prefixes};
use serde_json::{Value, json};

const CHUNK_WORDS: usize = 220;

struct Frontmatter<'a> {
    title: String,
    description: String,
    draft: bool,
    body: &'a str,
}

fn split_frontmatter(source: &str) -> Option<(&str, &str)> {
    let rest = source.strip_prefix("---")?;
    let whitespace = rest.len() - rest.trim_start_matches(js_space).len();
    // The opening whitespace is greedy, but must leave a later closing delimiter.
    let last_close = rest.rfind("\n---")?;
    let start = rest[..whitespace.min(last_close)].rfind('\n')? + 1;
    let (fields, body) = rest[start..].split_once("\n---")?;
    Some((fields, body.trim_start_matches(js_space)))
}

fn field_values<'a>(frontmatter: &'a str, key: &'a str) -> impl Iterator<Item = &'a str> {
    let lines = frontmatter
        .match_indices(LINE_END)
        .map(|(offset, end)| &frontmatter[offset + end.len()..]);
    std::iter::once(frontmatter)
        .chain(lines)
        .filter_map(move |line| {
            line.strip_prefix(key)?
                .trim_start_matches(js_space)
                .strip_prefix(':')
        })
        .map(|value| value.trim_start_matches(js_space))
}

fn first_line(text: &str) -> &str {
    text.split_once(LINE_END).map_or(text, |(line, _)| line)
}

fn get_field(frontmatter: &str, key: &str) -> String {
    let value = field_values(frontmatter, key).next().unwrap_or_default();
    let unquoted = value.strip_prefix(['"', '\'']).unwrap_or(value);
    let line = first_line(unquoted).trim_end_matches(js_space);
    line.strip_suffix(['"', '\'']).unwrap_or(line).to_owned()
}

fn has_draft(frontmatter: &str) -> bool {
    field_values(frontmatter, "draft").any(|value| {
        value
            .strip_prefix("true")
            .is_some_and(|rest| first_line(rest).chars().all(js_space))
    })
}

fn frontmatter(source: &str) -> Frontmatter<'_> {
    let (fields, body) = split_frontmatter(source).unwrap_or(("", source));
    Frontmatter {
        title: get_field(fields, "title"),
        description: get_field(fields, "description"),
        draft: has_draft(fields),
        body,
    }
}

fn strip_tags(mut text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    while let Some((before, body)) = text.split_once('<') {
        if body.starts_with(|c: char| c.is_ascii_alphabetic() || c == '/') {
            let Some((_, rest)) = body.split_once('>') else {
                break;
            };
            out.push_str(before);
            out.push(' ');
            text = rest;
        } else {
            out.push_str(before);
            out.push('<');
            text = body;
        }
    }
    out.push_str(text);
    out
}

fn after_indent(line: &str) -> Option<&str> {
    let rest = line.trim_start_matches(js_space);
    let indent = &line[..line.len() - rest.len()];
    (indent.chars().take(4).count() <= 3).then_some(rest)
}

fn flatten(s: &str) -> String {
    let s = replace_sections(s, "<!--", "-->", " ");
    let s = strip_tags(&s);
    let s = replace_links(&s, "![", true);
    let s = replace_links(&s, "[", false);
    let s = strip_line_prefixes(&s, |line| {
        after_indent(line)
            .and_then(|rest| rest.strip_prefix('>'))
            .map_or(0, |rest| {
                line.len() - rest.strip_prefix(js_space).unwrap_or(rest).len()
            })
    });
    let s = strip_line_prefixes(&s, |line| {
        after_indent(line)
            .and_then(|rest| rest.strip_prefix(['-', '*', '+']))
            .filter(|rest| rest.starts_with(js_space))
            .map_or(0, |rest| {
                line.len() - rest.trim_start_matches(js_space).len()
            })
    });
    let s = s.replace("__", "").replace(['*', '`'], "");
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        if matches!(c, ' ' | '\t') {
            if !out.ends_with(' ') {
                out.push(' ');
            }
        } else if c != '\n' || !out.ends_with("\n\n") {
            out.push(c);
        }
    }
    out.trim_matches(js_space).to_owned()
}

struct Section {
    level: u8,
    heading: Option<String>,
    text: String,
    code: Vec<String>,
}

struct SectionBuilder {
    level: u8,
    heading: Option<String>,
    lines: Vec<String>,
    code: Vec<String>,
}

fn take_section(sections: &mut Vec<Section>, builder: &mut SectionBuilder) {
    let text = flatten(&builder.lines.join("\n"));
    if builder.heading.is_some() || !text.is_empty() || !builder.code.is_empty() {
        sections.push(Section {
            level: builder.level,
            heading: builder.heading.take(),
            text,
            code: std::mem::take(&mut builder.code),
        });
    }
    builder.lines.clear();
}

fn fence_run(rest: &str) -> Option<&str> {
    let c = rest.chars().next()?;
    if c != '`' && c != '~' {
        return None;
    }
    let mut length = 0;
    for ch in rest.chars() {
        if ch != c {
            break;
        }
        length += ch.len_utf8();
    }
    (length >= 3).then(|| &rest[..length])
}

fn is_import_export(line: &str) -> bool {
    ["import", "export"].iter().any(|keyword| {
        line.strip_prefix(keyword)
            .and_then(|rest| rest.chars().next())
            .is_some_and(js_space)
    })
}

fn tail_matches(s: &str) -> bool {
    s.trim_start_matches(js_space)
        .trim_start_matches('#')
        .chars()
        .all(js_space)
}

fn match_heading(line: &str) -> Option<(u8, String)> {
    let level = line.chars().take_while(|&c| c == '#').count();
    if level == 0 || level > 6 {
        return None;
    }
    let hash_end = level;
    let mut starts = vec![hash_end];
    let mut index = hash_end;
    while let Some(c) = line[index..].chars().next() {
        if !js_space(c) {
            break;
        }
        index += c.len_utf8();
        starts.push(index);
    }
    if starts.len() == 1 {
        return None;
    }
    for start in starts[1..].iter().rev() {
        for (offset, c) in line[*start..].char_indices() {
            if LINE_END.contains(&c) {
                break;
            }
            let end = *start + offset + c.len_utf8();
            if tail_matches(&line[end..]) {
                return Some((level as u8, line[*start..end].to_string()));
            }
        }
    }
    None
}

fn is_close_fence(line: &str, fence: &str) -> bool {
    let Some(rest) = after_indent(line) else {
        return false;
    };
    fence_run(rest)
        .is_some_and(|run| run.starts_with(fence) && rest[run.len()..].chars().all(js_space))
}

fn parse_sections(body: &str) -> Vec<Section> {
    let mut sections = Vec::new();
    let mut builder = SectionBuilder {
        level: 0,
        heading: None,
        lines: Vec::new(),
        code: Vec::new(),
    };
    let mut fence: Option<String> = None;
    let mut code_lines: Vec<String> = Vec::new();
    for line in body.split('\n') {
        if let Some(open) = &fence {
            if is_close_fence(line, open) {
                builder.code.push(code_lines.join("\n"));
                fence = None;
                code_lines.clear();
            } else {
                code_lines.push(line.to_string());
            }
            continue;
        }
        if let Some(open) = after_indent(line).and_then(fence_run) {
            fence = Some(open.to_string());
            code_lines.clear();
            continue;
        }
        if is_import_export(line) {
            continue;
        }
        if let Some((level, heading)) = match_heading(line) {
            if level == 2 || level == 3 {
                take_section(&mut sections, &mut builder);
                builder = SectionBuilder {
                    level,
                    heading: Some(flatten(&heading)),
                    lines: Vec::new(),
                    code: Vec::new(),
                };
            } else {
                builder.lines.push(heading);
            }
            continue;
        }
        builder.lines.push(line.to_string());
    }
    if fence.is_some() {
        builder.code.push(code_lines.join("\n"));
    }
    take_section(&mut sections, &mut builder);
    if sections.is_empty() {
        sections.push(Section {
            level: 0,
            heading: None,
            text: String::new(),
            code: Vec::new(),
        });
    }
    sections
}

fn chunk(text: &str) -> Vec<String> {
    let words: Vec<&str> = text.split(' ').filter(|word| !word.is_empty()).collect();
    words
        .chunks(CHUNK_WORDS)
        .map(|chunk| chunk.join(" "))
        .collect()
}

fn sections_value(sections: &[Section]) -> Value {
    Value::Array(
        sections
            .iter()
            .map(|section| {
                json!({
                    "level": section.level,
                    "heading": section.heading,
                    "text": section.text,
                    "code": section.code,
                })
            })
            .collect(),
    )
}

fn parse_inputs(input: &str) -> Result<Vec<(String, String)>, String> {
    let value: Value =
        serde_json::from_str(input).map_err(|e| format!("stdin is not valid JSON: {e}"))?;
    let array = value
        .as_array()
        .ok_or_else(|| "stdin must be a JSON array of {name, file} objects".to_string())?;
    let mut inputs = Vec::with_capacity(array.len());
    for (index, item) in array.iter().enumerate() {
        let object = item
            .as_object()
            .ok_or_else(|| format!("input {index} is not an object"))?;
        let name = object
            .get("name")
            .and_then(Value::as_str)
            .ok_or_else(|| format!("input {index} is missing a string name"))?;
        let file = object
            .get("file")
            .and_then(Value::as_str)
            .ok_or_else(|| format!("input {index} is missing a string file"))?;
        inputs.push((name.to_string(), file.to_string()));
    }
    Ok(inputs)
}

fn build_output(inputs: &[(String, String)]) -> Result<Value, String> {
    let mut output = Vec::with_capacity(inputs.len());
    for (name, file) in inputs {
        let bytes = std::fs::read(file).map_err(|e| format!("cannot read {file}: {e}"))?;
        let source = String::from_utf8_lossy(&bytes);
        let front = frontmatter(&source);
        let (chat, sections) = if front.draft {
            (Value::Null, Value::Null)
        } else {
            let parsed = sections_value(&parse_sections(front.body));
            let stripped = port::strip_mdx(front.body.to_owned())
                .map_err(|e| format!("cannot strip {file}: {e}"))?;
            let chat = json!({
                "title": front.title.clone(),
                "chunks": chunk(&stripped),
            });
            let sections = json!({
                "title": front.title,
                "description": front.description,
                "sections": parsed,
            });
            (chat, sections)
        };
        output.push(json!({
            "name": name,
            "chat": chat,
            "sections": sections,
        }));
    }
    Ok(Value::Array(output))
}

fn run() -> Result<(), String> {
    let mut input = String::new();
    std::io::stdin()
        .read_to_string(&mut input)
        .map_err(|e| format!("cannot read stdin: {e}"))?;
    let inputs = parse_inputs(&input)?;
    let output = build_output(&inputs)?;
    let text = serde_json::to_string(&output).map_err(|e| format!("cannot encode output: {e}"))?;
    let mut stdout = std::io::stdout().lock();
    stdout
        .write_all(text.as_bytes())
        .and_then(|()| stdout.flush())
        .map_err(|e| format!("cannot write stdout: {e}"))
}

fn main() {
    if let Err(error) = run() {
        eprintln!("content-index: {error}");
        std::process::exit(1);
    }
}

#[cfg(test)]
mod tests {
    use super::frontmatter;

    #[test]
    fn frontmatter_keeps_legacy_multiline_fields_and_draft() {
        let post = frontmatter("---\ntitle:\n  'A title  '\ndraft:\n  true\n---\n\nBody");
        assert_eq!(post.title, "A title  ");
        assert!(post.draft);
        assert_eq!(post.body, "Body");
    }

    #[test]
    fn frontmatter_leaves_the_closing_delimiter_out_of_the_body() {
        let post = frontmatter("---\n\n---\n\nBody");
        assert_eq!(post.title, "");
        assert_eq!(post.body, "Body");
    }
}
