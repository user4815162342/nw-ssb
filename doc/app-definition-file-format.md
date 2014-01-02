
# Web Application Definition File 

The file which defines an application to run is a JSON file with similar
properties to the 'window' object in a node-webkit manifest, with a
few additional properties.

See the files in test-apps for some examples.

## Properties:

The following properties are supported. Where the meaning isn't specified,
please refer to the [node-webkit documentation.] [1]

[1]: <https://github.com/rogerwang/node-webkit/wiki/Manifest-format>

*url*: This is the address of the site to display.

*use-tray-icon*: Set this to true to display a system tray icon for the 
application which can be used to show and activate the application.
The icon used will be the same as the icon for the window. The icon
will include a menu to show and exit the application.

*minimize-to-tray*: Set this to true to cause the window to be hidden
when minimized. This option is not read if use-tray-icon is false.

*minimize-on-close*: Set this to true to cause the window to minimize
when it is closed (or hide if minimize-to-tray is true), instead of 
exiting the application. The application can be exited using the File 
menu.

*start-hidden*: If minimize-to-tray is true, then this option will default
to true, and the window will not display until it is opened via the
tray icon. Set this to false if you wish to prevent this.

*persist-window-appearance*: Set this to true to attempt to save
the window's unmaximized size and position between sessions.

*menu-bar*: Set this to false to hide the menubar. This flag is ignored
if minimize-on-close is true and use-tray-icon is false, or if kiosk 
mode is on, to ensure that the user has a way of exiting the application.

*title*:

*width*:

*height*:

*x*:

*y*:

*toolbar*: This is really only intended for debugging purposes. Unlike
node-webkit, the default is false.

*icon*:

*position*:

*min_width*:

*max_width*:

*min_height*:

*max_height*:

*as_desktop*:

*resizable*:

*always-on-top*:

*fullscreen*:

*frame*:

*kiosk*:


