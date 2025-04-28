# Hikka Forge ✨

Hikka Forge is a browser extension designed to enhance the user experience on `hikka.io` by injecting modular features and customizations. It allows users to enable or disable specific modules through a simple popup interface, dynamically loading or unloading features on the target website pages.

## Features

*   **Modular Architecture:** Easily add or remove functionalities (modules) without altering the core extension.
*   **Dynamic Loading:** Modules are loaded/unloaded based on user settings and the current `hikka.io` URL, ensuring features only run where intended.
*   **React Component Injection:** Modules can inject custom React components into specific locations on `hikka.io` pages.
*   **CSS Injection:** Modules can inject custom CSS styles to modify the appearance of `hikka.io`.
*   **Popup Management UI:** A user-friendly popup allows toggling modules on/off and refreshing active modules.
*   **Persistence:** Module enable/disable states are saved across browser sessions using `chrome.storage.sync`.
*   **Targeted Enhancement:** Specifically built to work with `https://hikka.io/`.
*   **Modern Tech Stack:** Built with React, TypeScript, Vite, `pnpm`, and Tailwind CSS (including shadcn/ui components).

## Included Modules (Examples)

*   **📦 Example Button Module:**
    *   **ID:** `example-button`
    *   **Description:** Adds a sample button (using shadcn/ui) below the main content area on specific `hikka.io` pages (e.g., anime detail pages). Demonstrates React component injection.
*   **📦 Font Replacement (Inter):**
    *   **ID:** `font-override`
    *   **Description:** Replaces all default fonts on `hikka.io` with the "Inter" font via CSS injection.

## Installation

There are two main ways to install Hikka Forge:

**1. From a Pre-built Package (Recommended for Users)**

*   Download the latest `.zip` package from the [Releases](https://github.com/your-username/hikka-forge/releases) page (replace with your actual repo link if applicable).
*   **Chrome/Edge:**
    *   Open your browser's extensions page (`chrome://extensions` or `edge://extensions`).
    *   Enable "Developer mode" (usually a toggle in the top-right corner).
    *   Drag and drop the downloaded `.zip` file onto the extensions page.
*   **Firefox:**
    *   Open the Firefox Add-ons Manager (`about:addons`).
    *   Click the gear icon next to "Manage Your Extensions".
    *   Select "Install Add-on From File...".
    *   Choose the downloaded `.zip` file.

**2. Loading Unpacked (For Development)**

*   Clone this repository: `git clone https://github.com/your-username/hikka-forge.git`
*   Navigate to the project directory: `cd hikka-forge`
*   Install dependencies using `pnpm`: `pnpm install`
*   Build the extension for your target browser:
    *   `pnpm run build:chrome`
    *   `pnpm run build:firefox`
    *   (This will create a `dist/chrome` or `dist/firefox` folder)
*   **Chrome/Edge:**
    *   Go to `chrome://extensions` or `edge://extensions`.
    *   Enable "Developer mode".
    *   Click "Load unpacked".
    *   Select the `dist/chrome` folder created in the previous step.
*   **Firefox:**
    *   Go to `about:debugging#/runtime/this-firefox`.
    *   Click "Load Temporary Add-on...".
    *   Navigate into the `dist/firefox` folder and select the `manifest.json` file.

## Usage

1.  Navigate to any page on `https://hikka.io/`.
2.  Click the Hikka Forge icon in your browser's toolbar to open the popup.
3.  You will see a list of available modules with their descriptions.
4.  Use the switches next to each module name to enable or disable it. Changes are saved automatically and should reflect on the page almost immediately (or upon navigation/refresh depending on the module).
5.  Click the "Refresh Content" button in the popup to force all active modules to reload their components/styles on the current page(s).

## Development

**Prerequisites:**

*   Node.js (LTS version recommended)
*   pnpm (Install via `npm install -g pnpm` if you don't have it)

**Setup:**

1.  Clone the repository: `git clone https://github.com/your-username/hikka-forge.git`
2.  Install dependencies: `cd hikka-forge && pnpm install`

**Build Commands:**

*   `pnpm run dev`: Starts Vite in watch mode (useful for development, auto-rebuilds on changes). You'll still need to load the `dist/<browser>` folder as unpacked and potentially reload the extension manually in the browser after significant changes (especially to background script).
*   `pnpm run build`: Builds the extension for both Chrome and Firefox.
*   `pnpm run build:chrome`: Builds the extension specifically for Chrome (output to `dist/chrome`).
*   `pnpm run build:firefox`: Builds the extension specifically for Firefox (output to `dist/firefox`).

**Loading for Development:**

Follow the "Loading Unpacked" instructions under the [Installation](#installation) section using the `dist/<browser>` directory after running a build command.

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request. Ensure you use `pnpm` for managing dependencies if you contribute code.

## License

MIT License