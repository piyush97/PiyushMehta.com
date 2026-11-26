#![forbid(unsafe_code)]

const LINE_END: [char; 4] = ['\n', '\r', '\u{2028}', '\u{2029}'];

fn js_space(c: char) -> bool {
    matches!(
        c,
        '\t'..='\r' | ' ' | '\u{a0}' | '\u{1680}' | '\u{2000}'..='\u{200a}'
            | '\u{2028}' | '\u{2029}' | '\u{202f}' | '\u{205f}' | '\u{3000}' | '\u{feff}'
    )
}

fn strip_line_prefixes(text: &str, prefix_len: impl Fn(&str) -> usize) -> String {
    let mut out = String::with_capacity(text.len());
    let mut cursor = 0;
    let starts =
        std::iter::once(0).chain(text.match_indices(LINE_END).map(|(i, end)| i + end.len()));
    for start in starts {
        if start < cursor {
            continue;
        }
        out.push_str(&text[cursor..start]);
        cursor = start + prefix_len(&text[start..]);
    }
    out.push_str(&text[cursor..]);
    out
}

fn replace_sections(mut text: &str, open: &str, close: &str, empty: &str) -> String {
    let mut out = String::with_capacity(text.len());
    while let Some((before, body)) = text.split_once(open)
        && let Some((inside, rest)) = body.split_once(close)
    {
        out.push_str(before);
        out.push_str(if inside.is_empty() { empty } else { " " });
        text = rest;
    }
    out.push_str(text);
    out
}

fn replace_links(mut text: &str, open: &str, image: bool) -> String {
    let mut out = String::with_capacity(text.len());
    while let Some((before, body)) = text.split_once(open) {
        let Some((label, after)) = body.split_once(']') else {
            break;
        };
        if let Some(target) = after.strip_prefix('(')
            && (image || !label.is_empty())
        {
            let Some((_, rest)) = target.split_once(')') else {
                break;
            };
            out.push_str(before);
            out.push_str(if image { " " } else { label });
            text = rest;
            continue;
        }
        // Every opener in this label has the same first closing bracket.
        out.push_str(&text[..text.len() - after.len()]);
        text = after;
    }
    out.push_str(text);
    out
}

pub fn strip_mdx(s: String) -> Result<String, String> {
    let s = strip_line_prefixes(&s, |line| {
        if line.starts_with("import ") || line.starts_with("export ") {
            line.find(LINE_END).unwrap_or(line.len())
        } else {
            0
        }
    });
    let s = replace_sections(&s, "```", "```", " ");
    let s = replace_sections(&s, "<", ">", "<>");
    let s = replace_links(&s, "![", true);
    let s = replace_links(&s, "[", false);
    let s = strip_line_prefixes(&s, |line| {
        let rest = line.trim_start_matches('#');
        if (1..=6).contains(&(line.len() - rest.len())) && rest.starts_with(js_space) {
            line.len() - rest.trim_start_matches(js_space).len()
        } else {
            0
        }
    });
    let s = strip_line_prefixes(&s, |line| {
        line.strip_prefix('>').map_or(0, |rest| {
            line.len() - rest.strip_prefix(js_space).unwrap_or(rest).len()
        })
    });
    let words: Vec<_> = s
        .split(|c| js_space(c) || matches!(c, '*' | '`'))
        .filter(|word| !word.is_empty())
        .collect();
    Ok(words.join(" "))
}
