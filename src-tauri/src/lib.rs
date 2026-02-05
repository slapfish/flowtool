use std::fs;
use std::path::PathBuf;

fn flows_dir() -> PathBuf {
    let cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    cwd.join(".flowtool")
}

#[tauri::command]
fn list_flows() -> Result<Vec<String>, String> {
    let dir = flows_dir();
    if !dir.exists() {
        return Ok(vec![]);
    }
    let mut names: Vec<String> = fs::read_dir(&dir)
        .map_err(|e| e.to_string())?
        .filter_map(|entry| {
            let entry = entry.ok()?;
            let name = entry.file_name().to_string_lossy().to_string();
            if name.ends_with(".json") {
                Some(name.trim_end_matches(".json").to_string())
            } else {
                None
            }
        })
        .collect();
    names.sort();
    Ok(names)
}

#[tauri::command]
fn read_flow(name: String) -> Result<String, String> {
    let path = flows_dir().join(format!("{}.json", name));
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_flow(name: String, data: String) -> Result<(), String> {
    let dir = flows_dir();
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join(format!("{}.json", name));
    fs::write(&path, data).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_flow(name: String) -> Result<(), String> {
    let path = flows_dir().join(format!("{}.json", name));
    if path.exists() {
        fs::remove_file(&path).map_err(|e| e.to_string())
    } else {
        Ok(())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            list_flows,
            read_flow,
            write_flow,
            delete_flow,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
