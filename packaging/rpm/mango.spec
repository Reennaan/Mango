Name: mango
Version: 1.0.1
Release: 1%{?dist}
Summary: Mango para Linux
License: MIT
URL: https://github.com/tequilasunset/Mango2-master
BuildArch: noarch
Requires: python3, python3-pip, python3-virtualenv

%description
Aplicação Mango para leitura de mangás em Linux.

%prep
rm -rf %{buildroot}
mkdir -p %{buildroot}/opt/mango %{buildroot}/usr/bin %{buildroot}/usr/share/applications %{buildroot}/usr/share/icons/hicolor/256x256/apps

%build

%install
cp -a %{_sourcedir}/src %{buildroot}/opt/mango/
cp -a %{_sourcedir}/assets %{buildroot}/opt/mango/
cp -a %{_sourcedir}/img %{buildroot}/opt/mango/
cp -a %{_sourcedir}/scripts %{buildroot}/opt/mango/
cp %{_sourcedir}/requirements-linux.txt %{buildroot}/opt/mango/
cp %{_sourcedir}/requirements.txt %{buildroot}/opt/mango/
cp %{_sourcedir}/README-linux.md %{buildroot}/opt/mango/
cp %{_sourcedir}/img/icon.png %{buildroot}/usr/share/icons/hicolor/256x256/apps/mango.png
cat > %{buildroot}/usr/bin/mango <<'EOF'
#!/usr/bin/env bash
exec /bin/bash /opt/mango/scripts/run-linux.sh "$@"
EOF
chmod 755 %{buildroot}/usr/bin/mango
cat > %{buildroot}/usr/share/applications/mango.desktop <<'EOF'
[Desktop Entry]
Type=Application
Name=Mango
Comment=Aplicação Mango para leitura de mangás
Exec=/usr/bin/mango
Icon=/usr/share/icons/hicolor/256x256/apps/mango.png
Terminal=false
Categories=Utility;Graphics;Viewer;
StartupNotify=true
EOF

%post
/usr/bin/python3 -m venv /opt/mango/.venv
/opt/mango/.venv/bin/pip install --upgrade pip
/opt/mango/.venv/bin/pip install -r /opt/mango/requirements-linux.txt
chmod +x /opt/mango/scripts/run-linux.sh

%files
/opt/mango/*
/usr/bin/mango
/usr/share/applications/mango.desktop
/usr/share/icons/hicolor/256x256/apps/mango.png
