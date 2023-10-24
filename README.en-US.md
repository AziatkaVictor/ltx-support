![Title](./data/Images/ReadMe/Title.gif)

[Russian translation](./README.md)

An extension for [Visual Studio Code](https://code.visualstudio.com/) that adds support for the logic syntax from **S.T.A.L.K.E.R. Call of Pripyat**. The plugin adds some features that should simplify the work for creating mods, as well as help beginners making their first mods. Probably the most important aspect of the extension is that it tries to adapt to the projects as much as possible.

![Demonstration](./data/Images/ReadMe/Demonstration.gif)

Currently implemented VSCode features:

* Completion *(Auto-completion)*:
    * Infos
    * Sections Types
    * Sections Links
    * Functions & Conditions
    * Localization
    * Squads
    * Tasks
    * Signals
* Hover Information
* Syntax Highlighting
* Semantic Highlighting
* Section Collapse
* Symbols (Visualization of file structure)

The list is constantly updated with new features with each new version.

# Settings

To enter the extension settings you need to:

* Press `Ctrl+Shift+P => Open Settings (UI)`.
* Open `Extensions => LTX` or just write `ltx` in the search bar.

# Building the extension

If you're interested in poking around the extension yourself or just help with the development, here is the information on how to build it. To do this, you need to:

1. Download the source code using `git clone`.
2. Open the project, run `npm install` in the console or click on `package.json` in the `NPM Scripts` spoiler and click on `Run install`.
3. After installing all the necessary libraries, you should press `Launch` in the `Run and Debug` tab or the `F5` hotkey.
4. Done. A new VS Code window should open with 2 test files in it.

# References

* [Profile on AP-PRO.RU](https://ap-pro.ru/profile/6-aziatkavictor/)
* [Forum topic](https://ap-pro.ru/forums/topic/3561-vscode-podderzhka-sintaksisa-cop/)
* [Wiki](https://github.com/AziatkaVictor/ltx-support/wiki)