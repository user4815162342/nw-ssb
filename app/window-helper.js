'use strict'

module.exports = function(win) {
    
        /**
         * The window 'close' event causes a problem when you have multiple
         * components which need to handle the event, since it allows any
         * one of them to force the window to close, even if another wanted
         * to prevent closing.
         *
         * This method creates a 'closing' event instead, which allows
         * a single listener to prevent the window from closing if it doesn't
         * want to (by calling method passed as an argument).
         * 
         * Unfortunately, I can't force anything to use this instead, 
         * so you will still need to update all of your other code
         * to work appropriately.
         * 
         * This method also creates a 'closingPrevented' event which will
         * fire if the closing was prevented.
         *
         * NOTE: This is called automatically by other helper methods
         * which require the use of the 'closing' event.
         * 
         * 
         * */
        win.addClosingEvent = function() {
            if (typeof win.__closingEventAdded === "undefined") {
                win.on('close',function() {
                    var closePrevented = false;
                    win.emit('closing',function() {
                        closePrevented = true;
                    });
                    if (!closePrevented) {
                        win.close(true);
                    } else {
                        win.emit('closingPrevented');
                    }
                });
                win.__closingEventAdded = true;
            }
        };

        /**
         * Allows persistence of the window position and size between sessions. 
         * The arguments are functions used to load and save the data.
         * The load function should return an object containing the data,
         * and null or undefined if it hasn't been saved, and the 
         * save should take the passed object and store it somewhere. 
         * The data will be JSON serializable.
         * 
         * The ready function is called once the persistence has been
         * set up. The caller can use this to show the form if it is
         * ready.
         * 
         * To avoid unwanted results, the window should be created as
         * hidden, and should be shown *after* this function is called
         * and has a chance to apply data to the window.
         * 
         * This should also be called after the loaded event has occurred
         * on the window, or it won't work properly.
         * */        
        win.persistLayout = function(load,store,ready) {
                // From https://github.com/rogerwang/node-webkit/wiki/Preserve-window-state-between-sessions
                /**
                 * Cross-platform window state preservation.
                 * Yes this code is quite complicated, but this is the best I came up with for
                 * current state of node-webkit Window API (v0.7.3 and later).
                 *
                 * Known issues:
                 * - unmaximization not always sets the window (x, y) in the lastly used coordinates
                 * - unmaximization animation sometimes looks wierd
                 * - extra height added to window, at least in linux x64 gnome-shell env. It seems that
                 *   when we read height then it returns it with window frame, but if we resize window
                 *   then it applies dimensions only to internal document without external frame.
                 *   Need to test in other environments with different visual themes.
                 *
                 * Change log:
                 * 2013.12.01
                 * - workaround of extra height in gnome-shell added
                 * 2014.01.01 (NMS)
                 * - remove the 'close' event, since this conflicts with close-to-tray functionality.
                 *   replace with a 'closing' event listener
                 * - modified to return an object which can be applied to any window, instead
                 *   of just the global window.
                 * - removed the deltaHeight code, as it seems to cause the window
                 *   to gradually shrink (by much more than the frame heights), and I 
                 *   don't see the problem it is fixing either (running linux 64 xfce).
                 *   My issue may be related to the window not being shown until after
                 *   the state is restored. And, it looks like this issue is supposedly
                 *   fixed? https://github.com/rogerwang/node-webkit/issues/173
                 * - automatically run the code that only works after loading in a loaded event.
                 */
            
            if (typeof win.__layoutPersisted === "undefined") {
                
                    // make sure the closing event is available.
                    win.addClosingEvent();

                    var winState;
                    var currWinMode;
                    var resizeTimeout;
                    var isMaximizationEvent = false;

                    // extra height added in linux x64 gnome-shell env, use it as workaround
                    //var deltaHeight = false;


                    var initWindowState = function() {
                        winState = load();

                        if (winState) {
                            currWinMode = winState.mode;
                            if (currWinMode === 'maximized') {
                                win.maximize();
                            } else {
                                restoreWindowState();
                            }
                        } else {
                            currWinMode = 'normal';
                            //deltaHeight = 0
                            dumpWindowState();
                        }

                        // NMS: Removed this because sometimes I don't want to show it yet.
                        // win.show();
                        // Everything is set up, so now...
                        if (ready) {
                            ready();
                        }
                    }

                    var dumpWindowState = function() {
                        if (!winState) {
                            winState = {};
                        }

                        // we don't want to save minimized state, only maximized or normal
                        if (currWinMode === 'maximized') {
                            winState.mode = 'maximized';
                        } else {
                            winState.mode = 'normal';
                        }

                        // when window is maximized you want to preserve normal
                        // window dimensions to restore them later (even between sessions)
                        if (currWinMode === 'normal') {
                            winState.x = win.x;
                            winState.y = win.y;
                            winState.width = win.width;
                            winState.height = win.height;

                            // save delta only of it is not zero
                            /*if (deltaHeight !== 0) {
                                winState.deltaHeight = deltaHeight;
                            }*/
                        }
                    }

                    var restoreWindowState = function() {
                        // deltaHeight already saved, so just restore it and adjust window height
                        /*if (typeof winState.deltaHeight !== 'undefined') {
                            deltaHeight = winState.deltaHeight
                            winState.height = winState.height - deltaHeight
                        }*/

                        win.resizeTo(winState.width, winState.height);
                        win.moveTo(winState.x, winState.y);
                    }

                    var saveWindowState = function() {
                        dumpWindowState();
                        store(winState);
                    }

                    initWindowState();

                    win.on('maximize', function () {
                        isMaximizationEvent = true;
                        currWinMode = 'maximized';
                    });

                    win.on('unmaximize', function () {
                        currWinMode = 'normal';
                        restoreWindowState();
                    });

                    win.on('minimize', function () {
                        currWinMode = 'minimized';
                    });

                    win.on('restore', function () {
                        currWinMode = 'normal';
                    });
                    
                    // This one can't be added until after loaded, since
                    // it depends on having the inner window object.
                    win.once('loaded',function() {
                        win.window.addEventListener('resize', function () {
                            // resize event is fired many times on one resize action,
                            // this hack with setTiemout forces it to fire only once
                            clearTimeout(resizeTimeout);
                            resizeTimeout = setTimeout(function () {

                                // on MacOS you can resize maximized window, so it's no longer maximized
                                if (isMaximizationEvent) {
                                    // first resize after maximization event should be ignored
                                    isMaximizationEvent = false;
                                } else {
                                    if (currWinMode === 'maximized') {
                                        currWinMode = 'normal';
                                    }
                                }

                                // there is no deltaHeight yet, calculate it and adjust window size
                                /*if (deltaHeight === false) {
                                    deltaHeight = win.height - winState.height;

                                    // set correct size
                                    if (deltaHeight !== 0) {
                                        win.resizeTo(winState.width, win.height - deltaHeight);
                                    }
                                }*/

                                dumpWindowState();

                            }, 500);
                        }, false);
                        
                    });
                    

                    
                    //NMS: Removed this because it messes with our close-to-tray system. Anyway, I need to call saveWindowState whenever I'm hiding.
                    win.on('closing', function () {
                        saveWindowState();
                        //this.close(true);
                    });
                    
                    
                
                win.__layoutPersisted = true;
            }
        };
        
        /**
         * This method connects the window to a tray icon, so that
         * clicking on the tray icon will minimize and restore the
         * window. It can also, optionally, attached itself to
         * a checkable menuItem so that the menu item is checked
         * when the window is open and unchecked when closed.
         * 
         * The third argument is a boolean indicating the known state
         * of the window at the time of setup. As I know of no way of
         * determining if a window is visible or not in node-webkit, 
         * except to keep the state here.
         * 
         * Note that, when restoring, the window will also be "shown",
         * first, in case hideOnMinimize is turned on.
         * 
         * */
         // TODO: Need to convert over to this method yet.
        win.attachTrayIcon = function(trayIcon,menuItem,currentlyVisible) {
            // Don't attach it to multiple tray Icons. 
            // TODO: Or should we?
            if (typeof win.__trayIcon === "undefined") {
               var up = currentlyVisible === true;
               if (menuItem && (menuItem.type !== "checkbox")) {
                   // don't mess with menuItem, since I can't check or uncheck it.
                   menuItem = null;
               }

               var lowered = function() {
                   up = false;
                   if (menuItem) {
                       menuItem.checked = false;
                   }
               }
               
               var raised = function() {
                   up = true;
                   if (menuItem) {
                       menuItem.checked = true;
                   }
               }


               var toggle = function() {
                   if (up) {
                      win.minimize();
                      lowered();
                   } else {
                       // in case we overrode the minimize to also hide the window.
                      win.show();
                      win.restore();
                      raised();
                   }
               }
               
               
               trayIcon.on('click',toggle);
               menuItem.click = toggle;
               menuItem.checked = up;
               // keep track of state
               win.on('minimize',lowered);
               win.on('restore',raised);
               
               up ? raised() : lowered();
               
               win.__trayIcon = trayIcon;
           }
        };
        
        win.hideOnMinimize = function() {
            if (typeof win.__hideOnMinimize === "undefined") {
                win.on('minimize',function() {
                    win.hide();
                });
                win.__hideOnMinimize = true;
            }
        };
        
        win.minimizeOnClose = function() {
            if (typeof win.__minimizeOnClose === "undefined") {
                // need closing event for this one...
                win.addClosingEvent();
                
                win.__minimizeOnClose = function(prevent) {
                    if (typeof win.__dontMinimizeOnClose === "undefined") {
                        // prevent closing unless we're specifically exiting.
                        prevent();
                        win.minimize();
                    } 
                };
                
                // in theory, I could just remove this listener, but that's
                // a problem if something *else* causes this to close to
                // fail.
                
                win.on('closing',win.__minimizeOnClose)
            }
        };
        
        win.closeWithoutMinimizing = function() {
            win.__dontMinimizeOnClose = true;
            // make sure we delete the minimize on close to retain the
            // behavior if something prevented the close.
            win.once('closingPrevented',function() {
                delete win.__dontMinimizeOnClose;
            });
            win.close();
        }
        
        return win;

}
