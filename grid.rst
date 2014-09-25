=============
Selenium Grid
=============

Selenium Grid is a smart proxy server that allows Selenium tests
to route commands to remote web browser instances.  Its aim is to
provide an easy way to run tests in parallel on multiple machines.

With Selenium Grid, one server acts as the hub that routes JSON
formatted test commands to one or more registered Grid nodes.  Tests
contact the hub to obtain access to remote browser instances.  The
hub has a list of registered servers that it provides access to,
and allows us to control these instances.

Selenium Grid allows us to run tests in parallel on multiple machines,
and to manage different browser versions and browser configurations
centrally (instead of in each individual test).

Pros and Cons
=============

Selenium Grid isn't a silver bullet.  It solves a subset of common
delegation and distribution problems, but will for example not
manage your infrastructure and might not suite your specific needs.

Pros
----

Scale

  Scale by distributing tests on several machines using parallel
  execution.

Central

  Manage multiple environments from a central point, making it easy
  to run the tests against a large combination of browsers and
  operating systems.

Minimize

  Minimize the maintenance time for the grid by allowing you to
  implement custom hooks to leverage a virtual infrastructure of
  registered nodes.

Cross-Platform

  If your tests are running on one particular platform, by using a
  node on another platform you effectively have cross-platform
  testing.

Smart

  Grid can route commands to a certain version of a browser if you
  have two or more nodes registered, each pointing to a different
  version of the browser binary.

Cons
----

Prompted input

  You have no capabilities for user input if your tests want to
  prompt for user input whereas you wuold if your tests ran locally.

Maintainability

  You also need to maintain the health of other computer systems
  which run your nodes.

Limited power

  Certain third party libraries have limitations that prevent them
  from being used in conjuction with Grid.

What is a Hub and Node?
=======================

A _hub_ is a central point from where your tests will be kicked
off.  There will only be one hub in a grid and it's launched from
one system.  The hub will connect one or more nodes that tests will
be delegated to.

_Nodes_ are different Selenium instances that will execute tests
on individual computer systems.  There can be many nodes in a grid.
The machines which are nodes need not be the same platform or have
the same browser selection as that of the hub or the other nodes.
A node on Windows might have the capability of offering Internet
Explorer as a browser option, whereas this wouldn't be possible on
Linux or Mac.

Rolling Your Own Grid
=====================

To use Selenium Grid you must maintain your own infrastructure for
the nodes.  Without this infrastructure, Grid will not function.
Many organizations use IaaS providers such as Amazon EC2 and Google
Compute to provide this infrastructure.

Other options include outsourcing the infrastructure management to
providers such as Sauce Labs or Testing Bot.  They provide grid
nodes as a service, but it's certainly possible to also run nodes
on your own hardware.  This chapter will go into detail about the
option of rolling your own grid, complete with its own node
infrastructure.

Quick Start
-----------

This example will show you how to start the Selenium 2 Hub, and
register both a WebDriver node and a Selenium 1 RC legacy node.
We’ll also show you how to call the grid from Java.  The hub and
nodes are shown here running on the same machine, but of course you
can copy the selenium-server-standalone to multiple machines.

The selenium-server-standalone package includes the hub, WebDriver,
and legacy RC needed to run the grid.  ant is not required anymore.
You can download the selenium-server-standalone-.jar from
http://code.google.com/p/selenium/downloads/list.

Step 1: Start the Hub
~~~~~~~~~~~~~~~~~~~~~

The hub is the central point that will receive test requests and
distribute them the the right nodes.  The distribution is done on
capabilities basis, meaning a test requiring a set of capabilities
will only be distributed to nods offering that set or subset of
capabilities.

Because a test's desired capabilities are just what the name implies,
_desired_, the hub cannot guarantee that it will locate a node fully
matching the requested desired capabilitie set.

Open a command prompt and navigate to the directory where you copied
the *selenium-server-standalone.jar* file.  You start the hub by
passing the `-role hub` flag to the standalone server::

    java -jar selenium-server-standalone.jar -role hub

The hub will listen to port 4444 by default.  You can view the
status of the hub by opening a browser window and navigating to:
http://localhost:4444/grid/console.

To change the default port, you can add the optional `-port` flag
with an integer representing the port to listen to when you run the
command.  Also, all of the other options you see in the JSON config
file (seen below) are possible command-line flags.

You certainly can get by with only the simple command show above,
but if you need more advanced configuration, then you may also for
convenience specify a JSON format config file to configure the gir
dhub when you start it.  You can do it like so::

    java -jar selenium-server-standalone.jar -role hub -hubConfig hubConfig.json -debug

Below you will see an example of a *hubConfig.json* file.  We will
go into more detail on how to provide node configuration files in
step 2.


.. code-block:: json

   {"_comment" : "Configuration for Hub - hubConfig.json",
    "host": ip,
    "maxSessions": 5,
    "port": 4444,
    "cleanupCycle": 5000,
    "timeout": 300000,
    "newSessionWaitTimeout": -1,
    "servlets": [],
    "prioritizer": null,
    "capabilityMatcher": "org.openqa.grid.internal.utils.DefaultCapabilityMatcher",
    "throwOnCapabilityNotPresent": true,
    "nodePolling": 180000,
    "platform": "WINDOWS"}

Step 2: Start the nodes
~~~~~~~~~~~~~~~~~~~~~~~

Regardless on whether you want to run a grid with new WebDriver
functionality, or a grid with Selenium 1 RC functionality, or both
at the same time, you use the same selenium-server-standalone.jar
file to start the nodes::

    java -jar selenium-server-standalone.jar -role node -hub http://localhost:4444/grid/register

The port defaults to 5555 if not specified whenever the *-role*
option is provided and is not hub.  You can run multiple nodes on
one machine but if you do so, you need to be aware of your systems
memory resources and problems with screenshots if your tests take
them.

###### Configuration of Node With Options

As mentioned, for backwards compatibility “wd” and “rc” roles are
still a valid subset of the “node” role.  But those roles limit the
types of remote connections to their corresponding API, while “node”
allows both RC and WebDriver remote connections.

Passing JVM properties (using the *-D* flag) on the command line
as well, and these will be picked up and propagated to the nodes::

    -Dwebdriver.chrome.driver=chromedriver.exe

###### Configuration of Node With JSON

You can also start grid nodes that are configured with a JSON
configuration file::

    java.exe -jar selenium-server-standalone.jar -role node -nodeConfig node1Config.json -Dwebdriver.chrome.driver=chromedriver.exe

And here is an example of a _nodeConfig.json_ file:

.. code-block:: json

   {"capabilities": [{"browserName": "firefox",
                      "acceptSslCerts": true,
                      "javascriptEnabled": true,
                      "takesScreenshot": false,
                      "firefox_profile": "",
                      "browser-version": "27",
                      "platform": "WINDOWS",
                      "maxInstances": 5,
                      "firefox_binary": "",
                      "cleanSession": true },
                     {"browserName": "chrome",
                      "maxInstances": 5,
                      "platform": "WINDOWS",
                      "webdriver.chrome.driver": "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe" },
                     {"browserName": "internet explorer",
                      "maxInstances": 1,
                      "platform": "WINDOWS",
                      "webdriver.ie.driver": "C:/Program Files (x86)/Internet Explorer/iexplore.exe" }],
    "configuration": {"_comment" : "Configuration for Node",
                      "cleanUpCycle": 2000,
                      "timeout": 30000,
                      "proxy": "org.openqa.grid.selenium.proxy.WebDriverRemoteProxy",
                      "port": 5555,
                      "host": ip,
                      "register": true,
                      "hubPort": 4444,
                      "maxSessions": 5}}
