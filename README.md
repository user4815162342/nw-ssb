
# nw-ssb

An application to run site-specific browsers using node-webkit. Just
define an application definition file (see docs and test-apps), and
run the file with this application.

## Building

Note that the app can be run without building if you have a copy of
node-webkit.

Install grunt
   sudo npm install -g grunt-cli

Install the node-webkit-builder

   npm install grunt-node-webkit-builder --save-dev

Update the grunt settings to turn on the appropriate platforms you want
to build for (see grunt-node-webkit-builder docs).

Run grunt from this directory

   grunt

The releases will be found under build/releases. 

## Security

As of node 0.8.3, I could find no documented features which would prevent
the sites loaded with this app from running nodejs code. Until this is 
resolved, be *very*, *very* careful with what sites you use this for.
If you don't know what I'm talking about here, don't use this application.
