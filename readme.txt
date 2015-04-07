/ ======================= \
| NOTES                   |
\ ======================= /

All the pieces used in the syllables for the passwords are in node_modules/syllables.json

/ ======================= \
| SETUP                   |
\ ======================= /

The system should work on any linux based system, so long as it has the necessary
packages (don't know how to set it up on a Windows based system).

/ ----------------------- \
| TERMINAL COMMANDS       |
\ ----------------------- /

Required terminal commands: npm, node

Skip to LAUNCHING AND OPERATING if you already have npm and node.

Use your distro's package manager to install these.
Installing npm should install node aswell. However, on some machines node will
be installed under the command nodejs. If this is the case, create a symbolic
link called 'node' in /usr/bin/ that points to nodejs.

The following command will create the symbolic link:

# ONLY DO THIS IF THE TERMINAL COMMAND IS nodejs INSTEAD OF node
$ sudo ln -s /usr/bin/nodejs /usr/bin/node

/ ----------------------- \
| LAUNCHING AND OPERATING |
\ ----------------------- /

Make sure you are in the pw-server/ directory (if you're reading this you should be in
there already anyways).

Run the following commands:

# This will install the required node_modules
$ npm install

# This will launch the node server on port 3000
$ ./bin/www

Now you can open your browser and navigate to 'localhost:3000'
