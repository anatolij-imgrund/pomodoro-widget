use tauri::menu::{Menu, MenuItem};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri::{Listener, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let quit_i = MenuItem::with_id(app, "quit", "Beenden", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&quit_i])?;

            // Hauptfenster holen
            let main_window = app.get_webview_window("main").unwrap();

            // Wenn der Timer abläuft, schickt das Frontend "alarm-triggered":
            // dann Fenster wieder anzeigen und in den Vordergrund holen.
            let w_clone = main_window.clone();
            main_window.listen("alarm-triggered", move |_event| {
                let _ = w_clone.show();
                let _ = w_clone.set_focus();
            });

            // Tray-Icon mit Menü; Linksklick holt das Widget zurück
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| {
                    if event.id == "quit" {
                        app.exit(0);
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    match event {
                        TrayIconEvent::Click { button: tauri::tray::MouseButton::Left, .. } => {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
