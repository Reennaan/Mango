# Mango no Linux

Este projeto já possui um ponto de entrada Python, mas ainda faltava uma forma simples de execução nas principais distribuições Linux.

## Como usar

1. Dê permissão aos scripts:
   ```bash
   chmod +x scripts/install-linux.sh scripts/run-linux.sh scripts/install-desktop.sh scripts/build-deb.sh scripts/build-rpm.sh
   ```
2. Instale as dependências e crie o ambiente virtual:
   ```bash
   ./scripts/install-linux.sh
   ```
3. Instale um atalho no menu do sistema:
   ```bash
   ./scripts/install-desktop.sh
   ```
4. Execute o Mango:
   ```bash
   ./scripts/run-linux.sh
   ```

## Gerar pacote para distribuição

- Debian/Ubuntu:
  ```bash
  ./scripts/build-deb.sh
  ```
- Fedora/RHEL:
  ```bash
  ./scripts/build-rpm.sh
  ```

## Distribuições suportadas

- Ubuntu/Debian
- Fedora
- Arch Linux

## Observações

- O script usa um ambiente virtual local em .venv.
- As variáveis de ambiente da interface foram ajustadas para funcionar melhor em ambientes Linux.
- Se a execução falhar por dependências gráficas, instale os pacotes extras do seu desktop/driver antes de tentar novamente.
- Para ambientes mais leves, é possível instalar apenas os pacotes do arquivo requirements-linux.txt.
