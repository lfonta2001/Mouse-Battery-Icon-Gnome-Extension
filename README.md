# Mouse Battery Display

This Gnome Extension displays the battery level of wireless mouse devices that use hidpp protocol in the top bar next to control panel.
On hover a mouse icon is shown and on click the battery is updated.


## Third party software

This extension needs <a href="https://github.com/pwr-Solaar/Solaar">Solaar<a/> cli tools to work since the extension does not implement a hidpp interpreter.


## IMPORTAN ACLARATIONS

The implementation for automatic update is done, but since I made this to run on my low resource laptop it freezed on every update, so I unabled it.
To enable it again just uncomment line 95 on extensions.js, last line of _init().

This extension was just tested with Logitech Pro X Superlight 2 mouse without any other wireless device connected in Ubuntu 24.04 LTS.

The use of any other operative system or device is not ensured to work correctly but feel free to try and make code sugestions or pull requests.


## Not so important aclarations

The _box commented property and all other related commented things are to show the battery and the icon alongside, but since it was too wide I didn't like it so I just made the hover thing.


Please feel free to change anything you like and suggest those changes to the code.