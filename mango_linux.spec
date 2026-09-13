# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_submodules, collect_data_files

a = Analysis(
    ['src/main.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('assets/', 'assets'),
        ('img/', 'img'),
    ]+ collect_data_files('PySide6'),
    hiddenimports=[
        "gi",
        "gi.repository",
        "gi.repository.Gtk",
        "gi.repository.WebKit2",
        "qtpy",
        "PySide6.QtCore",
        "PySide6.QtGui",
        'PySide6.QtWebChannel',
        'PySide6.QtNetwork', 
        "PySide6",
        "PySide6.QtWidgets",
        "PySide6.QtWebEngineWidgets",
        "PySide6.QtWebChannel",

    ] + collect_submodules('PySide6'),
    excludes=[
        'PyQt5', 'PyQt6',
        'tkinter',
        'matplotlib',
        'numpy',
    ],
    optimize=2,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='Mango',
    debug=False,
    strip=False,
    upx=False,
    console=False,
    icon=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    name='Mango',
)