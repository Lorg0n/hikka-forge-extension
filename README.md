# Hikka Forge

![Version](https://img.shields.io/badge/version-0.2.3-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Browser Support](https://img.shields.io/badge/browsers-Chrome%20%7C%20Firefox-orange.svg)

Hikka Forge is an open-source browser extension designed to enhance your Hikka.io browsing experience with custom features and personalized styles. It offers a modular system, allowing users to easily enable or disable specific functionalities and deeply customize the website's appearance.

## ✨ Features

*   **Advanced Theme Customizer:** Take complete control over Hikka.io's visual theme. Adjust primary and secondary colors, background gradients, text colors, card backgrounds, borders, and even the global border-radius to match your aesthetic.
*   **Font Override:** Replace the default website fonts with a modern and clean typeface like 'Inter', enhancing readability and visual appeal.
*   **Enhanced User Profiles:** Integrate additional information and components directly into user profile pages, such as displaying recent user comments.
*   **Modular System:** All functionalities are built as independent modules. Users can easily toggle these modules on or off via the extension's popup, ensuring a tailored experience without unnecessary clutter.
*   **Persistent Settings:** Your personalized theme settings and module preferences are automatically saved and restored across browser sessions.
*   **Dynamic Injection:** Hikka Forge intelligently injects features and styles only when needed on `hikka.io` pages, ensuring minimal performance impact and a smooth browsing experience.

## 🚀 Getting Started (for Developers)

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (LTS version recommended)
*   pnpm (specified as `packageManager` in `package.json`)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://gitlab.com/hikka-forge/hikka-forge-extension.git
    cd hikka-forge-extension
    ```
2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

### Development

Hikka Forge uses Vite for a fast development experience with hot module replacement (HMR).

*   **Run development server (for popup/options pages):**
    ```bash
    pnpm dev
    ```
    This will run a Vite development server for the popup and options pages.

*   **Build with watch mode for extension development:**
    For browser extension development, you'll want to use the `build:watch` scripts which compile the extension files directly into the `dist` folder.

    *   **For Chrome:**
        ```bash
        pnpm build:watch:chrome
        ```
    *   **For Firefox:**
        ```bash
        pnpm build:watch:firefox
        ```

    These commands will watch for changes in your source code and automatically recompile the extension, allowing for quick iteration when testing in the browser.

### Building for Production

To create a production-ready build of the extension:

*   **For Chrome:**
    ```bash
    pnpm build:chrome
    ```
    This will generate the extension files in the `dist/` directory, optimized for Chrome.

*   **For Firefox:**
    ```bash
    pnpm build:firefox
    ```
    This will generate the extension files in the `dist/` directory, optimized for Firefox.

## 📦 Loading the Extension in Your Browser

After building the extension (or while using `build:watch`):

### Google Chrome / Chromium-based Browsers

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable "Developer mode" in the top-right corner.
3.  Click the "Load unpacked" button.
4.  Navigate to the `dist` directory within your cloned project folder and select it.
5.  The "Hikka Forge" extension should now appear in your list of extensions.

### Mozilla Firefox

1.  Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2.  Click the "Load Temporary Add-on..." button.
3.  Navigate to the `dist` directory within your cloned project folder.
4.  Select the `manifest.json` file inside the `dist` folder.
5.  The "Hikka Forge" extension will be loaded. Note that temporary add-ons are removed when Firefox is closed. For persistent loading during development, you might want to use a tool like `web-ext run`.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

Please ensure your code adheres to the existing style and pass ESLint checks.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file

## 🙏 Acknowledgements

*   [Hikka Features](https://github.com/rosset-nocpes/hikka-features)
*   [React](https://react.dev/)
*   [Vite](https://vitejs.dev/)
*   [TypeScript](https://www.typescriptlang.org/)
*   [Tailwind CSS](https://tailwindcss.com/)
*   [Radix UI](https://www.radix-ui.com/)
*   [lucide-react](https://lucide.dev/icons/)
*   [shadcn/ui](https://ui.shadcn.com/)