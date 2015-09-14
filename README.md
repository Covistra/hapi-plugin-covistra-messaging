# Covistra Messaging Hapi plugin

Note: This plugin is designed to work within the Covistra Hapi Framework. You should at least integrate the following
additional plugins in your Hapi application to minimize integration pain. 

- hapi-plugin-covistra-config
- hapi-plugin-covistra-system
- hapi-plugin-covistra-socket


Providing a structure bi-directional communication mechanisms accessible through all components and integrated with the
existing security strategies is critical in today's realtime applications. This plugin extend Hapi to offer these services.

## Channels

A channel is a logical grouping of clients used to broadcast messages. Clients will subscribe to one or more channels of
interest to receive and send messages. Some channels are read-only for clients, while other are bi-directional.

