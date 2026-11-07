# ZLHRS Theme Studio

<img src="assets/studio-logo.png" width="128" alt="Логотип ZLHRS Theme Studio">

Одно приложение для выбора 16 тем ChatGPT на **Windows, macOS и Linux**. Превью чата, поиск, запоминание последней темы и отдельный ярлык запуска ChatGPT.

## Как начать

1. [Скачайте сборку для своей системы](https://github.com/ZLHRS/codex-anime-themes/releases/latest).
2. Установите и откройте **ZLHRS Theme Studio**.
3. Выберите тему. Если ChatGPT не найден, нажмите **«Выбрать приложение»**.
4. Запускайте **«ChatGPT с темой»** новым ярлыком — последняя тема включается сама.

ChatGPT должен быть установлен отдельно. Перед первым применением полностью закройте его. Старый закреплённый значок замените новым. Запуск из Store, напрямую или старым ярлыком не перехватывается.

| Система | Файл |
| --- | --- |
| Windows x64 | `…-win-x64.exe` — установщик |
| macOS Apple Silicon | `…-mac-arm64.dmg` |
| macOS Intel | `…-mac-x64.dmg` |
| Linux x64 | `…-linux-x64.AppImage` или `.deb` |

В готовых сборках всё внутри: Node.js, PowerShell и Codex App Manager устанавливать не нужно. Сборки пока без цифровой подписи и нотариализации Apple; macOS может потребовать подтверждения открытия в настройках безопасности. AppImage сначала сделайте исполняемым. [Подробная инструкция](docs/CROSS-PLATFORM.md).

![Каталог тем](docs/theme-selector-crossplatform.png)

Закрытие окна оставляет Studio в трее для поддержания темы. Полный выход — кнопка «Выйти из Studio» или меню значка. Ярлык ChatGPT снова запустит Studio при необходимости.

## Если клонируете исходники

```sh
git clone https://github.com/ZLHRS/codex-anime-themes.git
cd codex-anime-themes
npm ci
npm start
```

Для разработки нужен Node.js 24+. `npm test` проверяет темы и настройки; `npm run dist` создаёт сборку для текущей ОС. Готовые установщики находятся в Releases, а не в Git. Старый `ZLHRS Theme Studio.exe` в корне — совместимая Windows-версия 1.6 на PowerShell, оставленная для прежних пользователей; для нового интерфейса используйте Release 2.x.

## Каталог

Превью показывают демонстрационный чат с настоящими стилями и изображениями каждой темы: фон, расположение персонажей, сообщения и поле ввода. Личная переписка не используется. Вид в приложении зависит от размера окна и версии интерфейса. В Theme Studio нажмите на превью, чтобы открыть его крупнее.

| [Ай Хосино · Bunny Refrain](themes/ai-bunny-refrain) | [Ай Хосино · Starlit Encore](themes/ai-starlit-encore) |
| --- | --- |
| ![preview](previews/ai-bunny-refrain-chat.jpg) | ![preview](previews/ai-starlit-encore-chat.jpg) |

| [Azure Morpho](themes/azure-morpho) | [Фурина · Blue Cat Nocturne](themes/blue-cat-nocturne) |
| --- | --- |
| ![preview](previews/azure-morpho-chat.jpg) | ![preview](previews/blue-cat-nocturne-chat.jpg) |

| [C.C. · Mint Contract](themes/cc-mint-contract) | [Фубуки · Velvet Reflection](themes/fubuki-velvet) |
| --- | --- |
| ![preview](previews/cc-mint-contract-chat.jpg) | ![preview](previews/fubuki-velvet-chat.jpg) |

| [Фурина · Голубой свет](themes/furina-blue-daylight) | [Фурина · Moonlit Repose](themes/furina-moonlit-repose) |
| --- | --- |
| ![preview](previews/furina-blue-daylight-chat.jpg) | ![preview](previews/furina-moonlit-repose-chat.jpg) |

| [Ху Тао × Фурина · Красный и синий](themes/hu-tao-furina-duality) | [Резе · Night Bloom](themes/reze-night-bloom) |
| --- | --- |
| ![preview](previews/hu-tao-furina-duality-chat.jpg) | ![preview](previews/reze-night-bloom-chat.jpg) |

| [Шинобу Кочо · Wisteria Veil](themes/shinobu-wisteria) | [Sora · Silver Ribbon](themes/sora-ribbon) |
| --- | --- |
| ![preview](previews/shinobu-wisteria-chat.jpg) | ![preview](previews/sora-ribbon-chat.jpg) |

| [Сильфи · Moonstone Atelier](themes/sylphie-moonstone) | [Татсумаки · Jade Orbit](themes/tatsumaki-jade) |
| --- | --- |
| ![preview](previews/sylphie-moonstone-chat.jpg) | ![preview](previews/tatsumaki-jade-chat.jpg) |

| [Тацумаки · Jade Duo](themes/tatsumaki-jade-duo) | [Zero Two · Darling Rose](themes/zero-two-rose) |
| --- | --- |
| ![preview](previews/tatsumaki-jade-duo-chat.jpg) | ![preview](previews/zero-two-rose-chat.jpg) |

## Структура

- `desktop/` — общий интерфейс и механизм применения для трёх систем.
- `themes/`, `previews/`, `assets/` — темы, превью и логотип.
- `.github/workflows/desktop.yml` — сборки и проверки на Windows, macOS и Linux.
- `tests/` — проверки настроек, путей, запуска и содержимого тем.
- `launcher/` — общий runtime оформления и совместимость со старой Windows-версией.
- `Theme-Selector.ps1`, `Install-Studio.ps1`, `app/` — прежняя версия Windows 1.x.

## Совместимость и права

Это неофициальные пользовательские темы, зависящие от структуры интерфейса приложения. После обновления приложения может потребоваться адаптация CSS. Код запуска использует MIT-компоненты Wangnov; исходная лицензия сохранена в `launcher/LICENSE`. Иллюстрации и персонажи принадлежат их правообладателям, MIT-лицензия запуска не распространяется на изображения. Часть изображений обработана генеративным редактором. Источники отдельных иллюстраций не установлены; авторство на них не заявляется.

В набор не включены личные настройки, история чатов, ключи, логи и скриншоты переписки.

Оформление вкладки скинов вдохновлено [Codex App Manager](https://github.com/Wangnov/Codex-App-Manager). Интерфейс Theme Studio реализован отдельно на WPF.


Применение темы зависит от поддержки локального подключения Chromium и структуры интерфейса ChatGPT. Новое приложение собирается и проверяет галерею на каждой ОС; реальное оформление ChatGPT проверено локально только на Windows. Совместимость конкретной сборки ChatGPT на macOS/Linux ещё требует проверки на устройстве.
