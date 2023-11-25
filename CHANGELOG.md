## 0.6.2

* Code diagnostics and error resolution systems have been moved to classes to make things easier
* Added error solutions:
     * Removing a line
* Fixed collapsing sections
* Fixed function checking for conditions and actions in Condlist
* Fixed keyword completion
* English language support for extension settings

## 0.6.1

* Fixed a bug with missing parameters in some sections

# 0.6

* Added error code diagnostics:
     * Declaring multiple sections on one line
     * Duplication of sections with the same name
     * Link to a non-existent section
     *Invalid section type
     * Unused section
     * Empty section
     *Link to yourself
     * Link to several sections in one Condlist
     * Checking conditions with data pistons
     * Checking conditions with functions
     * Calling a non-existent function
     * Incorrect parameter entry
     *Unknown parameter
* Added error solutions:
     *Deleting a section
     * Replacement of reference with nil
     * Removing a section and replacing references with nil
     * Recommendations for replacing the section type if it is incorrect
     * Recommendations for replacing the function if it is incorrect
     * Recommendations for replacing a parameter if it is incorrect
     * Adding a section declaration
* Fixed an error when starting the program through a command
* Added and corrected diagnostic settings
* Minor fixes and code cleanup

## 0.5.4

* Documentation support for sections
* Fixed critical bug with dependencies

## 0.5.3

* Hover Provider for localization
* Preview sections when autocompleting `Task` or `Squad` variables
* Fixed an error that occurred when there were identical function names in `xr_effects.script` and `xr_conditions.script`
* Highligthing fix
* Several minor fixes

## 0.5.2

* Added documentation for some parameters
* Added the ability to update the extension documentation using the command. Also, by default, when the extension is launched, files are automatically updated, which can be disabled in the settings. This function requires an Internet connection.
* The module responsible for autocompletion has been combined into one common
* Fixed a bug where parameters were not displayed
* Several minor fixes

## 0.5.1

* Correction of a critical error when working with localization

# 0.5

* Added the ability to launch a game or other application from the editor. More details on [Wiki](https://github.com/AziatkaVictor/ltx-support/wiki/Start-Game-from-VSCode)
* Added the ability to update information about scripts using the `Update Scripts` command
* Added documentation for parameters *(writing in progress)* and command for writing it
* Added auto-completion of signals
* Added file support:
     *Tasks
     * Squads
     *Registration of sounds
     * Trade
* Added support for sections:
     *Anomal_zone
     * Smart_control
     *Smart_terrian
* Added support for parameters specific to NPC logic
* Added auto-completion of part of the parameter based on its type
* Syntax-based highlighting for signals
* Added file icons for the `*.ltx` extension
* Fixed the algorithm for obtaining localization, in which it would break if it received an empty table
* Code cleaning
* Minor bug fixes

# 0.4

* Added autocompletion of keywords such as `true`, `false` or `nil`
* Added documentation support. Now it is possible to conveniently, inside the extension, for example, add documentation for functions using the `Add Documentation` command. The process is described in more detail on [Wiki](https://github.com/AziatkaVictor/ltx-support/wiki/Documentation-Guide)<br>
![Docs](./data/Images/0.4/Docs.png)
* Added Hover Provider, which made it possible to display function documentation when hovering over it:<br>
![Hover](./data/Images/0.4/Hover.png)
* Transferring part of the syntax highlighting to a ready-made solution for the VSCode language extension. This made the expansion work faster.
* Added autocompletion of variables from localization files.
* Added Symbols Provider, which now displays the file structure and makes it possible to navigate by file:<br>
![Symbols1](./data/Images/0.4/Symbols1.png)<br>
![Symbols2](./data/Images/0.4/Symbols2.png)
* Added Folding Provider, which made it possible to collapse sections:<br>
![Folding](./data/Images/0.4/Folding.png)
* Some documentation for logic functions has been written, ~20-30 functions.

# 0.3

* Added auto-completion of section parameters, which are common to all types:<br>
![SectionsParams1](./data/Images/0.3/SectionParam1.png)
* Added auto-completion of section parameters based on their type:<br>
![SectionsParams2](./data/Images/0.3/SectionParam2.png)
* Added auto-completion of information engines from the current file:<br>
![Info](./data/Images/0.3/Info.png)
* The name of the current section has been removed from auto-completion with links to sections
* The path to the scripts is now taken relative to the working folder
* Added some Snippets that should speed up working with sections: _(WIP)_<br>
![Snippets](./data/Images/0.3/Snippets.png)
* Moved cursor position checks to the document class
* Added a document type that will allow you to divide the algorithm into working with different types _(logic files, configs, sections of items, squads, quests)_
* Added autocompletion of section types for declarations inside `[]`:<br>
![Sections](./data/Images/0.3/Sections.png)
* Reworking the structure of the extension code, distributing the functionality to Providers to make working more comfortable
* Added conditions for auto-completion of section links to work
* Adjust text highlighting for file paths
* Minor bug fixes

## 0.2.2

* Added auto-completion with sections from the current file:<br>
![SectionCompletion](./data/Images/0.2.2/SectionCompletion.png)<br>
* Squads and quests now have new icons:<br>
![NewIcons](./data/Images/0.2.2/NewIcons.png)<br>
* Fixed a bug with autocompletion of functions and checks for logic
* Fixed a bug when checking the cursor location inside the `%%` and `{}` brackets
* Minor code fixes related to asynchronous algorithms
* Fixed an issue that could appear when opening a file
* Multiple documents can now be stored in memory
* Fixed a bug where syntax highlighting was not updated when opening a file
* Squads and quests are now offered only inside the `%%` and `{}` brackets

## 0.2.1

* Fixed a bug with searching for files for squads and quests
* Added the ability to specify the path to the `misc` folder
* Redesigned extension settings in accordance with standards
* Changed the structure of the extension source code
* In the process of adding documentation in the code for those who want to help develop the extension
* Added asynchronous algorithms to speed up the extension. <br>Before: <br>
![Before](./data/Images/0.2.1/Before%20Async.png)<br>
After (usually this is 10-25 times faster):<br>
![After](./data/Images/0.2.1/After%20Async.png)
* Made minor bug fixes and code optimizations

# 0.2

* Added support for tooltips with squads and tasks (Works only if the files are in the required folders and have a standard file name pattern).<br>
![Quests](./data/Images/0.2/quests.png)
![Squads](./data/Images/0.2/squads.png)
* Support for simplified file parsing algorithm for optimization
* Optimization of extension operation
* Syntax highlighting information is now stored inside the file
* Minor fixes

## 0.1.4

* Added required libraries to the installation package, now the extension should work
* Changing the names of parameters
* Minor changes

## 0.1.3

* Fixed the search algorithm for `condlists`
* Fixed checking if the cursor is in parentheses
* Added support for syntax highlighting in `fsgame.ltx`
* Fixed algorithm for searching links to sections
* Highlighting Boolean values `true\false` in signals
* Support for the algorithm to work in text without sections (necessary for cases like `fsgame.ltx`)

## 0.1.2

* Correction of the parameter search algorithm
* Adding a check for a number in the signal value
* Minor fixes

## 0.1.1

* Correction of the section advertisement search algorithm
* Fixed checking that the cursor is inside special `"brackets"`
* Correction of the search algorithm for `condlists`
* Adding several `try-catch` constructs

# 0.1

* Suggest functions and preconditions for logic
* Support for custom files with scripts
* Keyword highlighting
* Highlighting conditions
* Function backlight
* Number highlighting
* Highlighting links to sections
* A file structure has been created for more convenient work with data