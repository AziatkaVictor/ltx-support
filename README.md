# ltx-support v.0.1.1

Расширение для Visual Studio Code, которое добавляет поддержку синтаксиса логики из S.T.A.L.K.E.R. Call of Pripyat.

## Настройки

Чтобы зайти в настройки расширения необходимо:

* Нажать `Ctrl+Shift+P => Open Settings (UI)`.
* Открыть `Extensions => LTX` или просто написать в поиске `ltx`.

## Работа с документацией

Расширение позволяет писать собственную документацию. На данный момент функционал готов не полностью, поэтому рекомендую особо не ковырять расширение. Как только будет решено, каким образом это должно работать, здесь появиться информация об этом.

## Собственные функции

Есть возможность указать собственные файлы со скриптами, для этого нужно в настройках указать путь к папке. Расширение само обновиться и будет предлагать вам функции. Так же хочу предупредить, что программа сама определяет расположение скобок `%%` и `{}`, поэтому подсказки функций будут появляться только внутри них.

## Roadmap

* Предложение переменных локализации
* Поддержка файлов с секциями квестов, сквадов, смартов, предметов, персонажей
* Оптимизация алгоритма анализа функций логики
* Кастомизация документации
* Заготовки с кусочками кода
* Анализ документа на ошибки
* Полноценная документация для функций логики
* Помощь с переменными у функций
* Подсветка особых типов данных (переменные, аргументы)

## Сборка расширения

Чтобы собрать расширение самому, необходимо:

1. Скачать исходники с помощью `git clone`, потому что я не рекомендую вам компилировать на файлах, которые лежат в папке со скаченным расширением. Лучше лишний раз перестраховаться.
2. Открыть проект, запустить в консоли `npm install` или нажать ПКМ на `package.json` в спойлере `NPM Scripts` и нажать на пункт `Run install`.
3. После установки всех необходимых библиотек, необходимо нажать `Launch` во вкладке `Run and Debug` или на горячую клавишу `F5`.
4. Готово. Должно открыться новое окно VS Code, в котором будет 2 тестовых файла.

## Ссылки

* [Профиль на AP-PRO.RU](https://ap-pro.ru/profile/6-aziatkavictor/)
* [Тема на форуме](https://ap-pro.ru/forums/topic/3561-vscode-podderzhka-sintaksisa-cop/)