#!/bin/sh
# Arguments are passed as separate argv entries; never interpolate a shell command.
kind=$1
download=$2
target=$3
studio_pid=$4
result=$5
count=0
while kill -0 "$studio_pid" 2>/dev/null; do
  count=$((count + 1))
  if [ "$count" -gt 120 ]; then printf '%s' 'Theme Studio не завершилось. Обновление отменено.' > "$result"; exit 1; fi
  sleep 0.5
done
success=false
if [ "$kind" = mac ]; then
  case "$target" in */ZLHRS\ Theme\ Studio.app) ;; *) exit 1;; esac
  parent=$(dirname "$target")
  stage=$(mktemp -d "$parent/.zlhrs-update.XXXXXX")
  if [ -n "$stage" ] && /usr/bin/ditto -x -k "$download" "$stage" && [ -d "$stage/ZLHRS Theme Studio.app" ]; then
    if mv "$target" "$stage/previous.app"; then
      if mv "$stage/ZLHRS Theme Studio.app" "$target"; then success=true; else mv "$stage/previous.app" "$target"; fi
    fi
  fi
elif [ "$kind" = appimage ]; then
  parent=$(dirname "$target")
  stage=$(mktemp -d "$parent/.zlhrs-update.XXXXXX")
  if [ -n "$stage" ] && cp "$download" "$stage/new.AppImage" && chmod +x "$stage/new.AppImage"; then
    if mv "$target" "$stage/previous.AppImage"; then
      if mv "$stage/new.AppImage" "$target"; then success=true; else mv "$stage/previous.AppImage" "$target"; fi
    fi
  fi
elif [ "$kind" = deb ]; then
  if pkexec /usr/bin/dpkg -i "$download"; then success=true; fi
fi
if [ "$success" = true ]; then printf '%s' 'Обновление установлено. Последняя тема сохранена.' > "$result"; else printf '%s' 'Обновление не установлено. Предыдущая версия сохранена.' > "$result"; fi
if [ "$kind" = mac ]; then /usr/bin/open -a "$target"; else "$target" >/dev/null 2>&1 & fi
