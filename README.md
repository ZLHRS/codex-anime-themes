# ZLHRS Theme Studio

<img src="assets/studio-logo.png" width="128" alt="Логотип ZLHRS Theme Studio">

Коллекция из 16 тем для настольного Codex / ChatGPT на Windows: отдельная папка на каждую тему, иллюстрации, палитры и инструкция по установке.

**[Как установить →](docs/INSTALL-RU.md)** · **[Скачать набор ZIP](codex-anime-themes.zip)**

## Как начать

1. Клонируйте репозиторий.
2. Откройте **ZLHRS Theme Studio.exe** — установка и создание ярлыков автоматические.
3. Выберите тему.
4. Запускайте **ChatGPT новым ярлыком** — последняя тема включается сама.

Можно также скачать и распаковать ZIP. Старый закреплённый значок ChatGPT замените новым.

**Запуск как обычного приложения:** EXE с собственной иконкой открывает окно без консоли. Внутри используется встроенный Windows PowerShell; дополнительных установок не нужно. EXE запускайте из полной папки комплекта — рядом нужны темы и остальные файлы.

**Всё для выбора и применения тем уже внутри. Node.js и Codex App Manager не требуются.** Нужно только установленное приложение Codex / ChatGPT для Windows.

![Меню выбора тем](docs/theme-selector.png)

**Автоматический запуск:** настраивается при первом открытии ZLHRS Theme Studio.exe. Новый ярлык открывает приложение сразу с последней темой; отдельный ярлык Theme Studio открывает каталог с поиском и карточками. Старый закреплённый значок нужно заменить новым.

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

- `themes/<id>/` — готовая тема: настройки, стили и используемые изображения.
- `previews/` — компактные превью для выбора.
- `docs/INSTALL-RU.md` — установка, переключение и устранение проблем.
- `Install-Themes.ps1` — копирование тем в пользовательскую папку, без выбора активной темы.
- `START.cmd` и `Theme-Selector.ps1` — встроенное окно выбора тем.
- `launcher/Theme-Engine.ps1` — автономный механизм применения без Node.js.
- Остальные файлы `launcher/` — совместимость со старым способом запуска.
- `catalog.json` — список всех тем.

## Совместимость и права

Это неофициальные пользовательские темы, зависящие от структуры интерфейса приложения. После обновления приложения может потребоваться адаптация CSS. Код запуска использует MIT-компоненты Wangnov; исходная лицензия сохранена в `launcher/LICENSE`. Иллюстрации и персонажи принадлежат их правообладателям, MIT-лицензия запуска не распространяется на изображения. Часть изображений обработана генеративным редактором. Источники отдельных иллюстраций не установлены; авторство на них не заявляется.

В набор не включены личные настройки, история чатов, ключи, логи и скриншоты переписки.

Оформление вкладки скинов вдохновлено [Codex App Manager](https://github.com/Wangnov/Codex-App-Manager). Интерфейс Theme Studio реализован отдельно на WPF.

