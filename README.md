![Title](./data/Images/ReadMe/Title.gif)

Расширение для [Visual Studio Code](https://code.visualstudio.com/), которое добавляет поддержку синтаксиса логики из **S.T.A.L.K.E.R. Call of Pripyat**. Плагин добавляет множество крупных и не очень функций, которые должны упростить работу над модификациями, а так же помочь новичкам начать делать свои первые моды. Наверное самым важным аспектом расширения являеться то, что оно пытаеться максимально, как это только возможно, адаптироваться под проекты.

![Demonstration](./data/Images/ReadMe/Demonstration.gif)

На данный момент реализованы такие функции VSCode, как:

* Completion *(Автодополнение)*:
    * Infos
    * Sections Types
    * Sections Links
    * Functions & Conditions
    * Localization
    * Squads
    * Tasks
    * Signals
* Hover *(Информация при наведении)*
* Syntax Highlighting *(Подсветка кода на основе синтаксиса)*
* Semantic Highlighting *(Подсветка кода на основе контекста)*
* Folding Ranges *(Сворачивание секций)*
* Symbols *(Визуализация структуры файла)*

Список постоянно пополняется новыми функциями, с выходом каждой новой версии.

# Настройки

Чтобы зайти в настройки расширения необходимо:

* Нажать `Ctrl+Shift+P => Open Settings (UI)`.
* Открыть `Extensions => LTX` или просто написать в поиске `ltx`.

# Сборка расширения

Если вам интересно поковырять расширение самому или просто помочь в разработке, то вот немного информации о том, как его собрать. Чтобы это сделать, необходимо:

1. Скачать исходники с помощью `git clone`
2. Открыть проект, запустить в консоли `npm install` или нажать ПКМ на `package.json` в спойлере `NPM Scripts` и нажать на пункт `Run install`.
3. После установки всех необходимых библиотек, необходимо нажать `Launch` во вкладке `Run and Debug` или на горячую клавишу `F5`.
4. Готово. Должно открыться новое окно VS Code, в котором будет 2 тестовых файла.

# Ссылки

* [Профиль на AP-PRO.RU](https://ap-pro.ru/profile/6-aziatkavictor/)
* [Тема на форуме](https://ap-pro.ru/forums/topic/3561-vscode-podderzhka-sintaksisa-cop/)
* [Wiki](https://github.com/AziatkaVictor/ltx-support/wiki)