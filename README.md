# Mango

Mango is a desktop manga organizer and downloader built with Python and PyWebView.

The application provides a simple interface for searching, downloading and organizing manga from multiple online sources.

## Features

* Search for manga from supported sources
* Download manga chapters
* Organize downloaded manga locally
* Support for:

  * JPG
  * PDF
  * EPUB
* Multiple manga providers
* Desktop interface powered by PyWebView
* Windows executable builds

## Supported Sources

Currently supported providers include:

* MangaDex
* Anime-Planet [NOT WORKING]
* WeebCentral
* Silentquill

## Installation

Download the latest release and run the Mango executable.

For development, clone the repository and install the required dependencies:

```bash
git clone https://github.com/Reennaan/Mango2.git
cd Mango2
pip install -r requirements.txt
```

Then run:

```bash
python main.py
```
## Linux

Mango can be installed on Linux using the provided .deb package or installation scripts.

## Recommended — Debian / Ubuntu / Ubuntu-based distributions

Download the latest mango.deb release and install it with:

sudo apt install ./mango.deb

The package automatically creates a Python virtual environment and installs the required dependencies.

After installation, run Mango with:

mango

You can also launch Mango from your desktop application menu.

## Building the .deb

The repository contains a script for generating the Debian package.

From the project root:

chmod +x scripts/deb.sh
./scripts/deb.sh

The generated package will be placed in:

dist/deb/mango.deb
## Installing with the installation script

The repository also includes a Linux installation script:

chmod +x scripts/install-linux.sh
./scripts/install-linux.sh
Running Mango manually

## To run Mango without installing the package:

chmod +x scripts/run-linux.sh
./scripts/run-linux.sh
## Desktop integration

The desktop.sh script can be used to create the desktop entry for Mango:

chmod +x scripts/desktop.sh
./scripts/desktop.sh
## RPM-based distributions

An RPM build script is also provided:

chmod +x scripts/rpm.sh
./scripts/rpm.sh

The exact installation command may vary depending on the distribution.

## Requirements
Linux
Python 3
Python virtual environment (venv)
pip
Required system dependencies listed in requirements-linux.txt
Windows

See the Windows release instructions and packaged executable available in the Releases page.

## Development

Clone the repository:

git clone https://github.com/Reennaan/Mango2.git
cd Mango2

Install the required dependencies:

pip install -r requirements.txt

Run the application:

python main.py


## Building

Mango can be packaged for Windows using PyInstaller.

The project also includes configuration for automated builds through GitHub Actions.


## Status

Mango is currently under active development.

