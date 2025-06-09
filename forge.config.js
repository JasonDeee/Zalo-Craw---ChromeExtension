const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");

module.exports = {
  packagerConfig: {
    asar: true,
    icon: "./Static",
    // Tối ưu dung lượng
    ignore: [
      /\.git/,
      /node_modules\/\.bin/,
      /\.nyc_output/,
      /coverage/,
      /\.env/,
      /\.vscode/,
      /test/,
      /tests/,
      /spec/,
      /docs/,
      /documentation/,
      /examples/,
      /sample/,
      /\.github/,
      /\.travis\.yml/,
      /\.appveyor\.yml/,
      /README\.md/i,
      /CHANGELOG\.md/i,
      /LICENSE/i,
      /\.d\.ts$/,
      /\.map$/,
    ],
    // Loại bỏ các modules không cần thiết
    prune: true,
    // Bật nén ASAR
    asar: {
      unpack: "*.{node,dll}",
    },
    win32metadata: {
      CompanyName: "Vanced Automation",
      ProductName: "Zalo Crawler",
      FileDescription:
        "Ứng dụng desktop tự động thu thập và tổ chức dữ liệu từ Zalo Web",
      ProductVersion: "1.2.0",
      FileVersion: "1.2.0.0",
      OriginalFilename: "ZaloCrawler.exe",
      InternalName: "ZaloCrawler",
      LegalCopyright:
        "Copyright © 2025 Vanced Automation. All rights reserved.",
      LegalTrademarks: "Zalo Crawler™",
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "zalo-crawler",
        setupIcon: "./Static/Favicon_128.ico",
        authors: "Vanced Automation",
        description:
          "Ứng dụng desktop tự động thu thập và tổ chức dữ liệu từ Zalo Web",
        setupExe: "ZaloCrawlerSetup.exe",
        noMsi: true,
        // Tối ưu installer
        noDelta: false, // Bật delta updates để giảm kích thước update
        remoteReleases: false,
        loadingGif: false, // Tắt loading gif để giảm dung lượng
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
      config: {
        name: "ZaloCrawler",
      },
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          maintainer: "Vanced Automation <contact@vancedautomation.com>",
          homepage: "https://github.com/JasonDeee/Zalo-Craw---ChromeExtension",
          description:
            "Ứng dụng desktop tự động thu thập và tổ chức dữ liệu từ Zalo Web",
          productDescription:
            "Zalo Crawler - Công cụ crawl dữ liệu từ Zalo Web",
          section: "utils",
          priority: "optional",
          categories: ["Utility", "Office"],
        },
      },
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {
        options: {
          license: "MIT",
          homepage: "https://github.com/JasonDeee/Zalo-Craw---ChromeExtension",
          description:
            "Ứng dụng desktop tự động thu thập và tổ chức dữ liệu từ Zalo Web",
          productDescription:
            "Zalo Crawler - Công cụ crawl dữ liệu từ Zalo Web",
          categories: ["Utility", "Office"],
        },
      },
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
