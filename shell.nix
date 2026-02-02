{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    # Node
    nodejs
    pnpm

    # Rust
    rustc
    cargo
    rustfmt
    clippy

    # Tauri system deps
    pkg-config
    openssl
    glib
    gtk3
    libsoup_3
    webkitgtk_4_1
    cairo
    pango
    gdk-pixbuf
    atk
  ];

  shellHook = ''
    export GIO_MODULE_DIR="${pkgs.glib-networking}/lib/gio/modules"
  '';
}
