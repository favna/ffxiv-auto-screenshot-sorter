# FFXIV Auto Screenshot Sorter

A tiny utility that can run in the background that automatically sorts your FFXIV screenshots. Primarily designed for
myself but you can deploy it on your own system as well.

## Installation

1. Start by downloading the binary from [the releases page][releases]
2. Create a configuration file, the location of this configuration file is opinionated and should be placed either in:
   - `~/.config/ffxiv-auto-screenshot-sorter/config.toml` on Linux and MacOS
   - `%LOCALAPPDATA%\ffxiv-auto-screenshot-sorter\config.toml` on Windows, with a fallback to
     `%APPDATA%\ffxiv-auto-screenshot-sorter\config.toml` and `C:\ffxiv-auto-screenshot-sorter\config.toml` in that
     order

## Configuration

The configuration file is a simple TOML file that looks like this:

```toml
[config]
# The path to where you have configured FFXIV to output screenshots to
screenshots = "/path/to/ffxiv/screenshots"

# The path to where you want the screenshots to be moved to
sorted = "/path/to/ffxiv/screenshots/sorted"

# The amount of retries to attempt for moving the file. Shortly after file creation the file is often still considered "busy" so the process retries a few times. The default is 5.
retries = 5

# The amount of seconds to wait between retries, the default is 2 seconds.
retry_delay = 2
```

Within the `output_folder` subfolders will be created in the format of `YYYY-MM` and the screenshots will be moved into
these folders. For example you may get a structure like this:

```txt
/sorted
  /2024-01
    screenshot-1.png
    screenshot-2.png
  /2024-02
    screenshot-3.png
    screenshot-4.png
```

## Quitting the program after launching it

Because there is no visual element or tray icon for this program, you can quit it through the Task Manager provided by
your operating system. This can be one of Windows Task Manager, MacOS Activity Monitor, or Linux [`htop`][htop].

## Recommended setup for Windows users

Windows users can use [XIVLauncher] to modify the launch of their FFXIV client. One of the options of [XIVLauncher] is
to automatically start a program when the game is launched. This can be used to start the `ffxiv-auto-screenshot-sorter`
binary.

[releases]: https://github.com/favna/ffxiv-auto-screenshot-sorter/releases
[XIVLauncher]: https://goatcorp.github.io
[htop]: https://htop.dev
